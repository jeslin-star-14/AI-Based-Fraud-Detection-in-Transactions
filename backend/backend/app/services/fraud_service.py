"""
Loads the Isolation Forest + KMeans models trained by
ai_engine/train_pipeline.py and uses them to score live transactions.

If the models haven't been trained yet (no .pkl files present), falls
back to a transparent rule-based score so the API still works out of
the box for a first run / demo.
"""

import os
import joblib
import numpy as np

from app.config import MODEL_DIR

FEATURES = ["amount", "hour", "distance_from_home", "is_new_location", "velocity", "is_foreign"]

_iso_forest = None
_kmeans = None
_scaler = None
_metrics = None
_models_loaded = False


def _load_models():
    global _iso_forest, _kmeans, _scaler, _metrics, _models_loaded
    if _models_loaded:
        return
    try:
        _iso_forest = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.pkl"))
        _kmeans = joblib.load(os.path.join(MODEL_DIR, "kmeans.pkl"))
        _scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
        _metrics = joblib.load(os.path.join(MODEL_DIR, "metrics.pkl"))
    except FileNotFoundError:
        _iso_forest = _kmeans = _scaler = None
        _metrics = {"precision": None, "recall": None, "f1": None}
    _models_loaded = True


def get_metrics():
    _load_models()
    return _metrics


def _rule_based_score(features: dict) -> int:
    """Fallback used only if models haven't been trained yet."""
    score = 0
    score += min(features["amount"] / 200, 40)
    score += 25 if features["is_new_location"] else 0
    score += 15 if features["is_foreign"] else 0
    score += min(features["velocity"] * 4, 20)
    return int(min(score, 99))


def score_transaction(features: dict):
    """
    features: dict with keys amount, hour, distance_from_home,
    is_new_location, velocity, is_foreign
    Returns: (risk_score 0-100, cluster_id or None)
    """
    _load_models()

    if _iso_forest is None:
        return _rule_based_score(features), None

    X = np.array([[features[f] for f in FEATURES]])
    X_scaled = _scaler.transform(X)

    # Isolation Forest's raw anomaly score -> normalize to 0-100
    raw = -_iso_forest.score_samples(X_scaled)[0]
    # empirically, raw scores for this feature set fall roughly in [0.35, 0.75]
    risk = int(np.clip((raw - 0.35) / (0.75 - 0.35) * 100, 0, 100))

    cluster = int(_kmeans.predict(X_scaled)[0])
    return risk, cluster


def status_from_risk(risk: int) -> str:
    if risk >= 70:
        return "flagged"
    if risk >= 40:
        return "review"
    return "cleared"
