"""
Thin wrapper around StandardScaler so training and inference always use
the exact same fitted scaler (never re-fit a scaler at inference time —
that's a common and subtle bug that silently corrupts risk scores).
"""

import os
import joblib
from sklearn.preprocessing import StandardScaler


def fit_scaler(X):
    scaler = StandardScaler()
    scaler.fit(X)
    return scaler


def save_scaler(scaler, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(scaler, path)


def load_scaler(path):
    return joblib.load(path)
