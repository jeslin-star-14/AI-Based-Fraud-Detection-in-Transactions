"""
Runs both anomaly detectors and both clustering algorithms on the same
data and prints a side-by-side comparison. This is what justifies "we
chose Isolation Forest and KMeans" with evidence rather than assertion —
run this and paste the output into your project report's evaluation
section.
"""

import time
import numpy as np

from models.anomaly_detection.isolation_forest_model import IsolationForestModel
from models.anomaly_detection.one_class_svm_model import OneClassSVMModel
from models.clustering.kmeans_model import KMeansModel
from models.clustering.dbscan_model import DBSCANModel
from evaluation.metrics import evaluate_predictions, scores_to_predictions, print_report


def compare_anomaly_models(X_scaled, y_true):
    results = {}

    t0 = time.time()
    iso = IsolationForestModel().fit(X_scaled)
    iso_scores = iso.anomaly_scores(X_scaled)
    iso_preds, _ = scores_to_predictions(iso_scores, percentile=95)
    iso_time = time.time() - t0
    iso_metrics = evaluate_predictions(y_true, iso_preds, iso_scores)
    iso_metrics["train_time_sec"] = round(iso_time, 3)
    print_report("Isolation Forest", iso_metrics)
    results["isolation_forest"] = iso_metrics

    t0 = time.time()
    ocsvm = OneClassSVMModel().fit(X_scaled)
    ocsvm_scores = ocsvm.anomaly_scores(X_scaled)
    ocsvm_preds, _ = scores_to_predictions(ocsvm_scores, percentile=95)
    ocsvm_time = time.time() - t0
    ocsvm_metrics = evaluate_predictions(y_true, ocsvm_preds, ocsvm_scores)
    ocsvm_metrics["train_time_sec"] = round(ocsvm_time, 3)
    print_report("One-Class SVM", ocsvm_metrics)
    results["one_class_svm"] = ocsvm_metrics

    return results


def compare_clustering_models(X_scaled):
    results = {}

    kmeans = KMeansModel(n_clusters=5).fit(X_scaled)
    results["kmeans"] = {
        "inertia": float(kmeans.inertia()),
        "n_clusters": 5,
    }
    print(f"\nKMeans            -> inertia: {kmeans.inertia():.1f}, clusters: 5")

    dbscan = DBSCANModel(eps=0.8, min_samples=10)
    labels = dbscan.fit_predict(X_scaled)
    n_clusters_found = len(set(labels)) - (1 if -1 in labels else 0)
    results["dbscan"] = {
        "noise_ratio": float(dbscan.noise_ratio()),
        "n_clusters_found": n_clusters_found,
    }
    print(f"DBSCAN            -> clusters found: {n_clusters_found}, noise ratio: {dbscan.noise_ratio():.3f}")

    return results
