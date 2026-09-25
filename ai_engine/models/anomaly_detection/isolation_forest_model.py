"""
Isolation Forest — the primary anomaly detection model for this project.

Why Isolation Forest for fraud:
- Doesn't require labeled fraud examples to train (unsupervised), which
  matches reality: confirmed fraud labels are scarce and delayed.
- Handles the class imbalance inherent to fraud naturally, via the
  `contamination` parameter, rather than needing SMOTE/undersampling.
- Scales well and gives a continuous anomaly score (not just a 0/1),
  which is what lets us show a 0-100 risk score instead of a hard cutoff.
"""

import joblib
from sklearn.ensemble import IsolationForest


class IsolationForestModel:
    def __init__(self, n_estimators=200, contamination=0.05, random_state=42):
        self.model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=random_state,
        )

    def fit(self, X_scaled):
        self.model.fit(X_scaled)
        return self

    def anomaly_scores(self, X_scaled):
        """Higher = more anomalous. Raw sklearn scores are negated so
        larger values consistently mean 'more suspicious' throughout
        this codebase."""
        return -self.model.score_samples(X_scaled)

    def predict_outliers(self, X_scaled):
        """Returns 1 for outliers (potential fraud), 0 for inliers,
        using the model's own fitted contamination threshold."""
        raw = self.model.predict(X_scaled)  # sklearn: -1 = outlier, 1 = inlier
        return (raw == -1).astype(int)

    def save(self, path):
        joblib.dump(self.model, path)

    @classmethod
    def load(cls, path):
        instance = cls()
        instance.model = joblib.load(path)
        return instance
