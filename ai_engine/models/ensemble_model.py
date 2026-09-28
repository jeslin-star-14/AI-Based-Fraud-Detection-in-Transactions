"""
Production ensemble model combining supervised (XGBoost) and unsupervised (Isolation Forest).

Risk score is a weighted combination:
  risk_score = w_supervised * supervised_score + w_unsupervised * unsupervised_score

Where supervised_score is the probability of fraud from XGBoost,
and unsupervised_score is the anomaly score from Isolation Forest (0-1 normalized).

Thresholds for FLAG and BLOCK are chosen from validation set by business cost analysis.
"""

import os
import json
import pickle
import logging
from typing import Dict, Tuple, Any
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_recall_curve, auc, confusion_matrix, roc_auc_score,
    precision_score, recall_score, f1_score
)

try:
    import xgboost as xgb
except ImportError:
    xgb = None

import shap

logger = logging.getLogger(__name__)


class EnsembleModel:
    """
    Supervised (XGBoost) + Unsupervised (Isolation Forest) ensemble.
    """

    def __init__(
        self,
        model_id: str,
        w_supervised: float = 0.7,
        w_unsupervised: float = 0.3,
        threshold_flag: float = 0.5,
        threshold_block: float = 0.8
    ):
        """
        Args:
            model_id: unique identifier for model versioning
            w_supervised: weight for XGBoost score (0-1)
            w_unsupervised: weight for Isolation Forest score (0-1)
            threshold_flag: flag for review if score >= this
            threshold_block: block transaction if score >= this
        """
        if xgb is None:
            raise ImportError("XGBoost required: pip install xgboost")
        
        self.model_id = model_id
        self.w_supervised = w_supervised
        self.w_unsupervised = w_unsupervised
        self.threshold_flag = threshold_flag
        self.threshold_block = threshold_block
        
        self.xgb_model = None
        self.iso_forest = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.explainer = None  # SHAP explainer
        self.trained_date = None
        self.dataset_hash = None
        
    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame = None,
        y_val: pd.Series = None,
        feature_names: list = None
    ):
        """
        Train both supervised and unsupervised models.
        
        Args:
            X_train: training features
            y_train: training labels
            X_val: validation features (for early stopping)
            y_val: validation labels
            feature_names: list of feature column names
        """
        logger.info(f"Training ensemble model {self.model_id}...")
        
        self.feature_names = feature_names or list(X_train.columns)
        
        # Standardize features for Isolation Forest
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # 1. Train XGBoost (supervised)
        logger.info("Training XGBoost...")
        eval_set = None
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            eval_set = [(X_val_scaled, y_val)]
        
        self.xgb_model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            eval_metric='logloss',
            use_label_encoder=False,
            tree_method='hist'
        )
        
        self.xgb_model.fit(
            X_train_scaled, y_train,
            eval_set=eval_set,
            early_stopping_rounds=10,
            verbose=False
        )
        
        xgb_train_score = self.xgb_model.score(X_train_scaled, y_train)
        logger.info(f"XGBoost training accuracy: {xgb_train_score:.4f}")
        
        # 2. Train Isolation Forest (unsupervised)
        logger.info("Training Isolation Forest...")
        self.iso_forest = IsolationForest(
            contamination=0.05,  # expect ~5% anomalies
            random_state=42,
            n_jobs=-1
        )
        self.iso_forest.fit(X_train_scaled)
        logger.info("Isolation Forest trained")
        
        # 3. Create SHAP explainer
        logger.info("Building SHAP explainer...")
        self.explainer = shap.TreeExplainer(self.xgb_model)
        
        self.trained_date = datetime.utcnow().isoformat()
        logger.info(f"Ensemble model trained at {self.trained_date}")

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Score transactions.
        
        Returns:
            {
              'risk_score': array of ensemble scores (0-1),
              'supervised_score': XGBoost probabilities,
              'unsupervised_score': Isolation Forest scores (normalized),
              'flag': boolean array (risk_score >= threshold_flag),
              'block': boolean array (risk_score >= threshold_block),
              'shap_values': SHAP values for feature importance
            }
        """
        if self.xgb_model is None or self.iso_forest is None:
            raise RuntimeError("Model not trained. Call train() first.")
        
        X_scaled = self.scaler.transform(X)
        
        # Supervised score (probability of fraud)
        supervised_score = self.xgb_model.predict_proba(X_scaled)[:, 1]
        
        # Unsupervised score (anomaly score, normalized to 0-1)
        # Isolation Forest returns -1 (anomaly) or 1 (normal)
        # Score is the number of splits to isolate each point
        iso_score = self.iso_forest.score_samples(X_scaled)
        # Normalize to 0-1: more negative = more anomalous
        unsupervised_score = 1 / (1 + np.exp(iso_score))  # sigmoid
        
        # Ensemble risk score
        risk_score = (
            self.w_supervised * supervised_score +
            self.w_unsupervised * unsupervised_score
        )
        
        # SHAP values for explainability
        shap_values = self.explainer.shap_values(X_scaled)
        # For binary classification, shap_values is a list [shap_neg, shap_pos]
        # We use shap_pos for fraud class
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        
        return {
            'risk_score': risk_score,
            'supervised_score': supervised_score,
            'unsupervised_score': unsupervised_score,
            'flag': risk_score >= self.threshold_flag,
            'block': risk_score >= self.threshold_block,
            'shap_values': shap_values
        }

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
        """
        Evaluate model on test set.
        
        Returns metrics:
        - precision, recall, F1 at chosen threshold
        - PR-AUC (more relevant than ROC-AUC for imbalanced data)
        - confusion matrix
        """
        preds = self.predict(X_test)
        risk_scores = preds['risk_score']
        
        # Use chosen threshold
        y_pred = (risk_scores >= self.threshold_flag).astype(int)
        
        # Compute metrics
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        # PR-AUC (precision-recall area under curve)
        precision_curve, recall_curve, _ = precision_recall_curve(y_test, risk_scores)
        pr_auc = auc(recall_curve, precision_curve)
        
        # ROC-AUC for reference
        roc_auc = roc_auc_score(y_test, risk_scores)
        
        # Confusion matrix
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        metrics = {
            'threshold_flag': self.threshold_flag,
            'threshold_block': self.threshold_block,
            'precision': float(precision),
            'recall': float(recall),
            'f1': float(f1),
            'pr_auc': float(pr_auc),
            'roc_auc': float(roc_auc),
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'true_positives': int(tp),
        }
        
        logger.info(
            f"Model evaluation (threshold={self.threshold_flag}):\n"
            f"  Precision: {precision:.4f}\n"
            f"  Recall: {recall:.4f}\n"
            f"  F1: {f1:.4f}\n"
            f"  PR-AUC: {pr_auc:.4f}\n"
            f"  ROC-AUC: {roc_auc:.4f}\n"
            f"  Confusion: TP={tp} FP={fp} FN={fn} TN={tn}"
        )
        
        return metrics

    def save(self, model_dir: str = "ai_engine/models/saved_models"):
        """Save model artifacts to directory."""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = model_dir / f"{self.model_id}"
        model_path.mkdir(exist_ok=True)
        
        # Save models
        with open(model_path / "xgb_model.pkl", "wb") as f:
            pickle.dump(self.xgb_model, f)
        
        with open(model_path / "iso_forest.pkl", "wb") as f:
            pickle.dump(self.iso_forest, f)
        
        with open(model_path / "scaler.pkl", "wb") as f:
            pickle.dump(self.scaler, f)
        
        # Save metadata
        metadata = {
            'model_id': self.model_id,
            'w_supervised': self.w_supervised,
            'w_unsupervised': self.w_unsupervised,
            'threshold_flag': self.threshold_flag,
            'threshold_block': self.threshold_block,
            'feature_names': self.feature_names,
            'trained_date': self.trained_date
        }
        
        with open(model_path / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Model saved to {model_path}")
        return str(model_path)

    @classmethod
    def load(cls, model_path: str):
        """Load model from directory."""
        model_path = Path(model_path)
        
        # Load metadata
        with open(model_path / "metadata.json") as f:
            metadata = json.load(f)
        
        # Create instance
        instance = cls(
            model_id=metadata['model_id'],
            w_supervised=metadata['w_supervised'],
            w_unsupervised=metadata['w_unsupervised'],
            threshold_flag=metadata['threshold_flag'],
            threshold_block=metadata['threshold_block']
        )
        
        # Load models
        with open(model_path / "xgb_model.pkl", "rb") as f:
            instance.xgb_model = pickle.load(f)
        
        with open(model_path / "iso_forest.pkl", "rb") as f:
            instance.iso_forest = pickle.load(f)
        
        with open(model_path / "scaler.pkl", "rb") as f:
            instance.scaler = pickle.load(f)
        
        instance.feature_names = metadata['feature_names']
        instance.trained_date = metadata['trained_date']
        
        # Recreate SHAP explainer
        instance.explainer = shap.TreeExplainer(instance.xgb_model)
        
        logger.info(f"Model loaded from {model_path}")
        return instance


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Ensemble model module ready for training pipeline.")
