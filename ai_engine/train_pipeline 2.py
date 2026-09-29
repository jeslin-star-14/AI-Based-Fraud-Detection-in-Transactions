"""
End-to-end training pipeline for the fraud detection AI engine.

    python train_pipeline.py            # trains and saves the production models
    python train_pipeline.py --compare  # also runs the model comparison report

Produces (in models/saved_models/):
    isolation_forest.pkl   <- production anomaly detection model
    kmeans.pkl              <- production clustering model
    scaler.pkl              <- fitted StandardScaler (needed at inference time)
    metrics.pkl             <- evaluation metrics dict, for the backend + report
"""

import os
import sys
import argparse
import joblib

sys.path.append(os.path.dirname(__file__))  # so `models.*`/`preprocessing.*` imports resolve

from data_generator import generate_dataset
from preprocessing.data_cleaning import clean_transactions
from preprocessing.feature_engineering import FEATURES, to_matrix
from preprocessing.scaler_utils import fit_scaler, save_scaler
from models.anomaly_detection.isolation_forest_model import IsolationForestModel
from models.clustering.kmeans_model import KMeansModel
from evaluation.metrics import evaluate_predictions, scores_to_predictions, print_report

SAVE_DIR = os.path.join(os.path.dirname(__file__), "models", "saved_models")


def train(run_comparison=False):
    os.makedirs(SAVE_DIR, exist_ok=True)

    print("Generating dataset...")
    raw_df = generate_dataset(n_legit=4000, n_fraud=200)

    print("Cleaning data...")
    df = clean_transactions(raw_df)

    X = to_matrix(df)
    y = df["label"].values

    print("Fitting scaler...")
    scaler = fit_scaler(X)
    X_scaled = scaler.transform(X)

    print("Training Isolation Forest (anomaly detection)...")
    iso_model = IsolationForestModel(n_estimators=200, contamination=0.05).fit(X_scaled)
    anomaly_scores = iso_model.anomaly_scores(X_scaled)
    preds, threshold = scores_to_predictions(anomaly_scores, percentile=95)
    metrics = evaluate_predictions(y, preds, anomaly_scores)
    print_report("Isolation Forest (production model)", metrics)

    print("\nTraining KMeans (behavioral clustering)...")
    kmeans_model = KMeansModel(n_clusters=5).fit(X_scaled)
    print(f"  Inertia: {kmeans_model.inertia():.1f}")

    print("\nSaving models to", SAVE_DIR)
    iso_model.save(os.path.join(SAVE_DIR, "isolation_forest.pkl"))
    kmeans_model.save(os.path.join(SAVE_DIR, "kmeans.pkl"))
    save_scaler(scaler, os.path.join(SAVE_DIR, "scaler.pkl"))
    joblib.dump(metrics, os.path.join(SAVE_DIR, "metrics.pkl"))
    joblib.dump({"threshold": float(threshold), "features": FEATURES},
                os.path.join(SAVE_DIR, "scoring_config.pkl"))

    if run_comparison:
        from evaluation.model_comparison import compare_anomaly_models, compare_clustering_models
        print("\n" + "=" * 60)
        print("MODEL COMPARISON REPORT")
        print("=" * 60)
        compare_anomaly_models(X_scaled, y)
        compare_clustering_models(X_scaled)

    print("\nDone.")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--compare", action="store_true", help="Also run the anomaly/clustering model comparison")
    args = parser.parse_args()
    train(run_comparison=args.compare)
