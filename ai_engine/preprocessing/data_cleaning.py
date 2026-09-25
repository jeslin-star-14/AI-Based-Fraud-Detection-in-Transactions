"""
Basic cleaning for incoming transaction data. Even with synthetic data
this matters once you plug in real transaction logs, which are rarely
clean: missing fields, negative amounts from refunds, duplicate rows
from retried API calls, etc.
"""

import pandas as pd


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Drop exact duplicates (e.g. from retried webhook deliveries)
    df = df.drop_duplicates()

    # Amounts should never be negative for this model (refunds are a
    # separate transaction type and should be filtered upstream)
    df = df[df["amount"] > 0]

    # Clip hour to valid range in case of timezone bugs upstream
    df["hour"] = df["hour"].clip(0, 23)

    # Fill any missing categorical flags conservatively (treat unknown
    # as "not new / not foreign" rather than assuming risk)
    for col in ["is_new_location", "is_foreign"]:
        if col in df.columns:
            df[col] = df[col].fillna(0).astype(int)

    df["velocity"] = df["velocity"].fillna(0).clip(lower=0)
    df["distance_from_home"] = df["distance_from_home"].fillna(0).clip(lower=0)

    return df.reset_index(drop=True)
