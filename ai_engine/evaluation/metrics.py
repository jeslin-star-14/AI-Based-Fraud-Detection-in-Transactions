"""
Evaluation against the synthetic ground-truth labels. In a real deployment
you'd evaluate against confirmed fraud cases (chargebacks, manual review
outcomes) instead — this module works the same either way, it just needs
a `y_true` array of 0/1 labels and `y_pred` array of 0/1 predictions.
"""

import numpy as np
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)


def evaluate_predictions(y_true, y_pred, y_scores=None) -> dict:
    metrics = {
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
    }
    if y_scores is not None:
        try:
            metrics["roc_auc"] = roc_auc_score(y_true, y_scores)
        except ValueError:
            metrics["roc_auc"] = None

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    metrics["confusion_matrix"] = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    return metrics


def scores_to_predictions(scores, percentile=95):
    """Turns continuous anomaly scores into 0/1 predictions by
    thresholding at the given percentile — i.e. 'flag the top 5% most
    anomalous transactions'. This is what maps a raw model score onto a
    concrete decision."""
    threshold = np.percentile(scores, percentile)
    return (scores >= threshold).astype(int), threshold


def print_report(name: str, metrics: dict):
    print(f"\n{name}")
    print(f"  Precision : {metrics['precision']:.3f}")
    print(f"  Recall    : {metrics['recall']:.3f}")
    print(f"  F1 score  : {metrics['f1']:.3f}")
    if metrics.get("roc_auc") is not None:
        print(f"  ROC-AUC   : {metrics['roc_auc']:.3f}")
    cm = metrics["confusion_matrix"]
    print(f"  Confusion : TP={cm['tp']}  FP={cm['fp']}  FN={cm['fn']}  TN={cm['tn']}")
