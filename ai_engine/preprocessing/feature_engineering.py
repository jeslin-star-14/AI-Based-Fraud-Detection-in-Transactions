"""
Single source of truth for which features feed the models and in what
order. Both train_pipeline.py and any live-scoring code (e.g. the
backend's fraud_service.py) should import FEATURES and to_vector() from
here, so training and inference never drift apart.
"""

import numpy as np
import pandas as pd

# Order matters: this is the exact column order the models are trained on.
FEATURES = [
    "amount",
    "hour",
    "distance_from_home",
    "is_new_location",
    "velocity",
    "is_foreign",
]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Adds any derived features on top of the raw fields. Kept as its
    own step (separate from data_cleaning) so new signals can be added
    here without touching cleaning logic."""
    df = df.copy()

    # Derived signal: is this a high-value transaction relative to a
    # typical one, on a log scale so it doesn't get swamped by raw amount
    df["amount_log"] = np.log1p(df["amount"])

    # Derived signal: unusual hour flag (late night / very early morning)
    df["is_unusual_hour"] = ((df["hour"] < 5) | (df["hour"] > 22)).astype(int)

    return df


def to_vector(features: dict) -> list:
    """Converts a single transaction's feature dict into the model's
    expected input order. Raises KeyError loudly if a required feature
    is missing, rather than silently defaulting — a missing feature at
    inference time should be fixed, not guessed."""
    return [features[f] for f in FEATURES]


def to_matrix(df: pd.DataFrame) -> np.ndarray:
    """Same as to_vector but for a whole DataFrame at once (training)."""
    return df[FEATURES].values
