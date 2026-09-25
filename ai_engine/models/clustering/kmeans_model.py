"""
KMeans — groups transactions into behavioral clusters (e.g. "normal
small purchase", "high-velocity card testing", "large foreign wire").
This is what lets the AI agent say a flagged transaction "matches a
pattern seen before" instead of treating every case in isolation.

Why KMeans as the primary clustering choice: fast, deterministic given
a fixed random_state, and produces a fixed, interpretable number of
groups that map cleanly to a fraud analyst's mental model ("cluster 3
is card-testing"). DBSCAN (below) is kept as a comparison since it can
find arbitrarily-shaped clusters and doesn't require picking k upfront.
"""

import joblib
from sklearn.cluster import KMeans


class KMeansModel:
    def __init__(self, n_clusters=5, random_state=42, n_init=10):
        self.model = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=n_init)

    def fit(self, X_scaled):
        self.model.fit(X_scaled)
        return self

    def predict(self, X_scaled):
        return self.model.predict(X_scaled)

    def inertia(self):
        return self.model.inertia_

    def cluster_centers(self):
        return self.model.cluster_centers_

    def save(self, path):
        joblib.dump(self.model, path)

    @classmethod
    def load(cls, path):
        instance = cls()
        instance.model = joblib.load(path)
        return instance
