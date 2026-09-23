"""
Trains the two core models for this project:

1. Isolation Forest  -> anomaly detection. Scores every transaction with
   how "outlier-like" it is; this becomes the 0-100 risk score.
2. KMeans clustering -> groups transactions into behavioral clusters, so
   the agent can say things like "this matches the cluster we usually
   see for card-testing fraud."

Run this once before starting the backend:
    python train_pipeline.py
Produces: models/saved_models/isolation_forest.pkl
          models/saved_models/kmeans.pkl
          models/saved_models/scaler.pkl
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score

from data_generator import generate_dataset

FEATURES = ["amount", "hour", "distance_from_home", "is_new_location", "velocity", "is_foreign"]
SAVE_DIR = os.path.join(os.path.dirname(__file__), "models", "saved_models")


def train():
    os.makedirs(SAVE_DIR, exist_ok=True)
    df = generate_dataset(n_legit=4000, n_fraud=200)
    X = df[FEATURES].values
    y = df["label"].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # contamination ~ expected fraud rate in the data
    iso_forest = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42,
    )
    iso_forest.fit(X_scaled)

    # 5 behavioral clusters: e.g. normal-small, normal-large, new-location,
    # high-velocity, foreign-high-value
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    kmeans.fit(X_scaled)

    # Quick evaluation against the synthetic ground truth (for the report)
    raw_scores = -iso_forest.score_samples(X_scaled)  # higher = more anomalous
    threshold = np.percentile(raw_scores, 95)
    preds = (raw_scores >= threshold).astype(int)

    precision = precision_score(y, preds, zero_division=0)
    recall = recall_score(y, preds, zero_division=0)
    f1 = f1_score(y, preds, zero_division=0)

    print(f"Isolation Forest  -> precision: {precision:.3f}  recall: {recall:.3f}  f1: {f1:.3f}")
    print(f"KMeans inertia    -> {kmeans.inertia_:.1f}")

    joblib.dump(iso_forest, os.path.join(SAVE_DIR, "isolation_forest.pkl"))
    joblib.dump(kmeans, os.path.join(SAVE_DIR, "kmeans.pkl"))
    joblib.dump(scaler, os.path.join(SAVE_DIR, "scaler.pkl"))
    joblib.dump({"precision": precision, "recall": recall, "f1": f1},
                os.path.join(SAVE_DIR, "metrics.pkl"))

    print(f"\nSaved models to {SAVE_DIR}")


if __name__ == "__main__":
    train()
