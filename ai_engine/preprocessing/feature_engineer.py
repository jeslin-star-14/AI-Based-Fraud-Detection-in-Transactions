"""
Feature engineering from PaySim transactions and account history.

All features are derived from account-level statistics, enabling velocity and
behavioral anomaly detection.
"""

import pandas as pd
import numpy as np
import logging
from typing import Tuple
from datetime import timedelta

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """Compute behavioral features from account history."""

    def __init__(self, window_hours=(1, 24)):
        """
        Args:
            window_hours: tuple of time windows for velocity in hours (1h, 24h)
        """
        self.window_hours = window_hours
        self.feature_names = []

    def engineer(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute features for each transaction.
        
        Assumes df has:
        - Step: transaction time (in hours from start)
        - nameOrig, nameDest: account identifiers
        - Amount: transaction amount
        - Type: transaction type
        - oldbalanceOrig, newbalanceOrig: account balance before/after
        - isFraud: ground truth label
        
        Returns:
            df with added feature columns
        """
        df = df.copy()
        
        # Convert Step (hours) to a datetime for window operations
        df['timestamp'] = pd.to_datetime(df['Step'], unit='h', origin='2013-01-01')
        
        # Sort by originating account and timestamp for window operations
        df = df.sort_values(['nameOrig', 'timestamp']).reset_index(drop=True)
        
        logger.info("Engineering features from account history...")
        
        # 1. Velocity features: transaction count in rolling windows
        for window_h in self.window_hours:
            col_name = f'velocity_{window_h}h'
            df[col_name] = df.groupby('nameOrig')['timestamp'].transform(
                lambda x: x.rolling(
                    f'{window_h}H', closed='left'
                ).count().fillna(0).values
            )
            self.feature_names.append(col_name)
        
        # 2. Amount statistics per account
        # Mean amount sent by this account
        amount_mean = df.groupby('nameOrig')['Amount'].transform('mean')
        df['amount_mean_per_account'] = amount_mean
        self.feature_names.append('amount_mean_per_account')
        
        # Std amount sent by this account
        amount_std = df.groupby('nameOrig')['Amount'].transform('std').fillna(0)
        df['amount_std_per_account'] = amount_std
        self.feature_names.append('amount_std_per_account')
        
        # 3. Amount z-score vs account's own history
        # How far is this amount from this account's typical behavior?
        df['amount_zscore'] = (
            (df['Amount'] - amount_mean) / (amount_std + 1e-6)
        )
        self.feature_names.append('amount_zscore')
        
        # 4. Time since last transaction for this account
        df['time_since_last_tx'] = df.groupby('nameOrig')['timestamp'].transform(
            lambda x: x.diff().dt.total_seconds() / 3600  # in hours
        ).fillna(0)
        self.feature_names.append('time_since_last_tx')
        
        # 5. New recipient flag (first time sending to this destination)
        df['new_recipient'] = ~df.groupby('nameOrig')['nameDest'].transform(
            lambda x: x.isin(x.shift().dropna())
        ).astype(int)
        self.feature_names.append('new_recipient')
        
        # 6. Balance drain ratio: (oldbalance - newbalance) / oldbalance
        # High ratio = sending out a large fraction of balance
        df['balance_drain_ratio'] = np.where(
            df['oldbalanceOrig'] > 0,
            (df['oldbalanceOrig'] - df['newbalanceOrig']) / df['oldbalanceOrig'],
            0
        )
        self.feature_names.append('balance_drain_ratio')
        
        # 7. Transaction type encoding
        tx_type_dummies = pd.get_dummies(df['Type'], prefix='type')
        df = df.join(tx_type_dummies)
        for col in tx_type_dummies.columns:
            self.feature_names.append(col)
        
        # 8. Hour of day (cyclic encoding)
        hour = df['timestamp'].dt.hour
        df['hour_sin'] = np.sin(2 * np.pi * hour / 24)
        df['hour_cos'] = np.cos(2 * np.pi * hour / 24)
        self.feature_names.extend(['hour_sin', 'hour_cos'])
        
        # 9. Day of week (cyclic encoding)
        day = df['timestamp'].dt.dayofweek
        df['day_sin'] = np.sin(2 * np.pi * day / 7)
        df['day_cos'] = np.cos(2 * np.pi * day / 7)
        self.feature_names.extend(['day_sin', 'day_cos'])
        
        # 10. Amount in log scale
        df['log_amount'] = np.log1p(df['Amount'])
        self.feature_names.append('log_amount')
        
        logger.info(f"Engineered {len(self.feature_names)} features")
        logger.info(f"Feature names: {self.feature_names}")
        
        return df

    def get_feature_names(self) -> list:
        """Return list of engineered feature column names."""
        return self.feature_names


def time_based_split(
    df: pd.DataFrame,
    train_frac: float = 0.6,
    val_frac: float = 0.2
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split dataset by time to avoid leakage.
    
    Future transactions cannot be in training data.
    
    Args:
        df: sorted by timestamp
        train_frac: fraction for training (default 60%)
        val_frac: fraction for validation (default 20%)
        test_frac: remaining fraction for testing
    
    Returns:
        train_df, val_df, test_df
    """
    n = len(df)
    train_idx = int(n * train_frac)
    val_idx = train_idx + int(n * val_frac)
    
    logger.info(f"Time-based split: train={train_frac:.0%} ({train_idx}), "
                f"val={val_frac:.0%} ({val_idx - train_idx}), "
                f"test={1 - train_frac - val_frac:.0%} ({n - val_idx})")
    
    return df.iloc[:train_idx], df.iloc[train_idx:val_idx], df.iloc[val_idx:]


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Example usage
    from data_loader import load_paysim
    
    df = load_paysim()
    
    # Engineer features
    engineer = FeatureEngineer()
    df = engineer.engineer(df)
    
    print(f"\nDataset shape: {df.shape}")
    print(f"\nFeatures: {engineer.get_feature_names()}")
    print(f"\nSample features:\n{df[engineer.get_feature_names()].head()}")
    
    # Time-based split
    train, val, test = time_based_split(df)
    print(f"\nTrain: {len(train)}, Val: {len(val)}, Test: {len(test)}")
    print(f"Train fraud rate: {train['isFraud'].mean():.2%}")
    print(f"Val fraud rate: {val['isFraud'].mean():.2%}")
    print(f"Test fraud rate: {test['isFraud'].mean():.2%}")
