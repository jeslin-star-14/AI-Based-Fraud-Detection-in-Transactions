"""
One-Class SVM — kept as a comparison baseline against Isolation Forest.

Trade-off vs. Isolation Forest: One-Class SVM can capture more complex,
non-linear decision boundaries, but it's more sensitive to the `nu` and
`gamma` hyperparameters and scales worse on larger datasets (O(n^2)-ish
in practice). Useful to report in your evaluation section as "why we
picked Isolation Forest" evidence rather than asserting it without proof.
"""

import joblib
from sklearn.svm import OneClassSVM


class OneClassSVMModel:
    def __init__(self, nu=0.05, kernel="rbf", gamma="scale"):
        self.model = OneClassSVM(nu=nu, kernel=kernel, gamma=gamma)

    def fit(self, X_scaled):
        self.model.fit(X_scaled)
        return self

    def anomaly_scores(self, X_scaled):
        """Higher = more anomalous (negated distance from the decision
        boundary, so the sign convention matches IsolationForestModel)."""
        return -self.model.decision_function(X_scaled)

    def predict_outliers(self, X_scaled):
        raw = self.model.predict(X_scaled)  # -1 = outlier, 1 = inlier
        return (raw == -1).astype(int)

    def save(self, path):
        joblib.dump(self.model, path)

    @classmethod
    def load(cls, path):
        instance = cls()
        instance.model = joblib.load(path)
        return instance
