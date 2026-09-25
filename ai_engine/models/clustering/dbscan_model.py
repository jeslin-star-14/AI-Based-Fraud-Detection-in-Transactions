"""
DBSCAN — density-based clustering, kept as a comparison baseline
against KMeans.

Trade-off vs. KMeans: DBSCAN doesn't require choosing k upfront and can
find irregularly shaped clusters, and it naturally labels sparse,
isolated points as noise (-1) rather than forcing them into a cluster —
which is arguably a better fit for fraud, since fraudulent transactions
are often genuine outliers rather than a dense group of their own. The
trade-off is sensitivity to `eps`/`min_samples` and weaker performance
on datasets with mixed cluster densities.
"""

import joblib
from sklearn.cluster import DBSCAN


class DBSCANModel:
    def __init__(self, eps=0.8, min_samples=10):
        self.model = DBSCAN(eps=eps, min_samples=min_samples)
        self._labels = None

    def fit_predict(self, X_scaled):
        self._labels = self.model.fit_predict(X_scaled)
        return self._labels

    def noise_ratio(self):
        """Fraction of points DBSCAN considers noise (label -1) — often
        a useful proxy for how many transactions don't fit any normal
        behavioral pattern."""
        if self._labels is None:
            raise RuntimeError("Call fit_predict() first.")
        return (self._labels == -1).mean()

    def save(self, path):
        joblib.dump(self.model, path)

    @classmethod
    def load(cls, path):
        instance = cls()
        instance.model = joblib.load(path)
        return instance
