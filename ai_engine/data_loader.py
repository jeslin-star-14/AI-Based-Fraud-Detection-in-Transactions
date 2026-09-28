"""
PaySim dataset loader and preprocessor.

PaySim is a synthetic dataset based on real data from Kaggle, but unlike the
anonymized credit-card dataset (PCA-transformed features, no account ID),
PaySim includes:
- Account IDs (originating_account, destination_account)
- Transaction timestamps (enables velocity and recency features)
- Transaction types (PAYMENT, TRANSFER, CASH_IN, CASH_OUT, DEBIT)
- Account balances (enables balance-drain ratio)
- Fraud labels

This allows us to engineer real behavioral features:
- Velocity (transactions per account in 1h, 24h windows)
- Account history statistics (mean/std of amounts sent)
- Time since last transaction
- Amount z-score vs account's own history
- New recipient flag
- Balance drain ratio
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class PaySimLoader:
    """Load and preprocess PaySim dataset."""

    def __init__(self, data_dir: str = "ai_engine/data/raw"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.df = None

    def download_if_needed(self) -> str:
        """
        Download PaySim from Kaggle if not present.
        Requires: pip install kaggle
        Then: kaggle datasets download -d ealaxi/paysim1
        """
        paysim_file = self.data_dir / "PS_20174392719_1491204840751_log.csv"
        
        if paysim_file.exists():
            logger.info(f"PaySim dataset found at {paysim_file}")
            return str(paysim_file)
        
        logger.error(
            f"PaySim dataset not found at {paysim_file}.\n"
            "To download:\n"
            "  1. pip install kaggle\n"
            "  2. kaggle datasets download -d ealaxi/paysim1 -p {}\n"
            "  3. unzip the CSV to {}\n"
            "See: https://www.kaggle.com/datasets/ealaxi/paysim1".format(
                self.data_dir, self.data_dir
            )
        )
        raise FileNotFoundError(
            f"PaySim dataset required at {paysim_file}. Please download it."
        )

    def load(self) -> pd.DataFrame:
        """Load PaySim dataset."""
        paysim_file = self.download_if_needed()
        
        logger.info(f"Loading PaySim from {paysim_file}")
        self.df = pd.read_csv(paysim_file)
        
        # PaySim columns:
        # Step, Type, Amount, nameOrig, oldbalanceOrig, newbalanceOrig,
        # nameDest, oldbalanceDest, newbalanceDest, isFraud, isFlaggedFraud
        
        logger.info(f"Loaded {len(self.df)} transactions")
        logger.info(f"Fraud rate: {self.df['isFraud'].mean():.2%}")
        logger.info(f"Columns: {list(self.df.columns)}")
        
        return self.df

    def validate(self) -> bool:
        """Check dataset integrity."""
        if self.df is None:
            return False
        
        required_cols = [
            'Step', 'Type', 'Amount', 'nameOrig', 'oldbalanceOrig',
            'newbalanceOrig', 'nameDest', 'oldbalanceDest', 'newbalanceDest',
            'isFraud', 'isFlaggedFraud'
        ]
        
        missing = [c for c in required_cols if c not in self.df.columns]
        if missing:
            logger.error(f"Missing columns: {missing}")
            return False
        
        if self.df.isnull().any().any():
            logger.error("Dataset contains nulls")
            return False
        
        logger.info("Dataset validation passed")
        return True


def load_paysim() -> pd.DataFrame:
    """Load and validate PaySim dataset."""
    loader = PaySimLoader()
    df = loader.load()
    if not loader.validate():
        raise ValueError("PaySim validation failed")
    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    loader = PaySimLoader()
    df = loader.load()
    print(df.head())
    print(df.info())
