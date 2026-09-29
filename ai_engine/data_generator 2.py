"""
Generates a synthetic but realistic transaction dataset for training and
demoing the fraud detection models. In production this would be replaced
by real (anonymized) transaction logs from the payment platform — drop
a CSV loader into preprocessing/data_cleaning.py and point train_pipeline.py
at it instead of generate_dataset().

Raw fields per transaction (before feature engineering):
- amount              : transaction value
- hour                : hour of day (0-23), fraud skews toward odd hours
- distance_from_home  : km from account's usual location
- is_new_location     : 1 if this location hasn't been used before
- velocity            : transactions by this account in the last hour
- is_foreign          : 1 if cross-border transaction
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)

LOCATIONS = ["Chennai, IN", "Mumbai, IN", "Austin, US", "Berlin, DE",
             "Toronto, CA", "Lagos, NG", "Manila, PH", "London, UK"]
METHODS = ["Card", "UPI", "Wire", "Net Banking"]


def _generate_legit(n):
    return pd.DataFrame({
        "amount": np.round(RNG.gamma(2.0, 120, n), 2),
        "hour": RNG.normal(14, 4, n).clip(0, 23).astype(int),
        "distance_from_home": RNG.exponential(5, n),
        "is_new_location": RNG.choice([0, 1], n, p=[0.92, 0.08]),
        "velocity": RNG.poisson(1.2, n),
        "is_foreign": RNG.choice([0, 1], n, p=[0.95, 0.05]),
    })


def _generate_fraud(n):
    return pd.DataFrame({
        "amount": np.round(RNG.gamma(6.0, 900, n), 2),
        "hour": RNG.normal(2, 3, n).clip(0, 23).astype(int),
        "distance_from_home": RNG.exponential(400, n) + 100,
        "is_new_location": RNG.choice([0, 1], n, p=[0.15, 0.85]),
        "velocity": RNG.poisson(5, n),
        "is_foreign": RNG.choice([0, 1], n, p=[0.4, 0.6]),
    })


def generate_dataset(n_legit=4000, n_fraud=200):
    """Returns a DataFrame of raw features plus a ground-truth `label`
    column (0 = legitimate, 1 = fraud) used only for evaluation — the
    anomaly models themselves never see this column during training."""
    legit = _generate_legit(n_legit)
    fraud = _generate_fraud(n_fraud)
    legit["label"] = 0
    fraud["label"] = 1
    df = pd.concat([legit, fraud], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
    return df


def generate_live_feed(n=25):
    """Generates a small batch of transactions with display metadata
    (account, location, method) — used to seed a demo/API dataset."""
    df = generate_dataset(n_legit=int(n * 0.85), n_fraud=int(n * 0.15) or 1).sample(
        n=n, random_state=RNG.integers(0, 10000)
    ).reset_index(drop=True)
    df["account"] = [f"AC-{RNG.integers(1000, 9999)}" for _ in range(n)]
    df["location"] = RNG.choice(LOCATIONS, n)
    df["method"] = RNG.choice(METHODS, n)
    return df


if __name__ == "__main__":
    data = generate_dataset()
    print(data.describe())
    print(f"\nGenerated {len(data)} rows ({data['label'].sum()} fraudulent)")
