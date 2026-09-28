#!/usr/bin/env python
"""
End-to-end training pipeline: data loading → feature engineering → train/val/test split
→ model training → evaluation → save model artifacts.

Run: python ai_engine/train_pipeline.py
"""

import os
import sys
import json
import hashlib
import logging
from datetime import datetime
from pathlib import Path

import pandas as pd
import numpy as np

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai_engine.data_loader import PaySimLoader, load_paysim
from ai_engine.preprocessing.feature_engineer import FeatureEngineer, time_based_split
from ai_engine.models.ensemble_model import EnsembleModel

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def compute_dataset_hash(df: pd.DataFrame) -> str:
    """Compute hash of dataset for versioning."""
    data_str = pd.util.hash_pandas_object(df, index=True).values.tobytes()
    return hashlib.sha256(data_str).hexdigest()[:16]


def run_training_pipeline():
    """Execute full training pipeline."""
    
    logger.info("=" * 80)
    logger.info("PHASE 1: REAL DATA AND TRAINING")
    logger.info("=" * 80)
    
    # 1. Load dataset
    logger.info("\n[1/5] Loading PaySim dataset...")
    try:
        df = load_paysim()
    except FileNotFoundError as e:
        logger.error(str(e))
        return False
    
    dataset_hash = compute_dataset_hash(df)
    logger.info(f"Dataset hash: {dataset_hash}")
    
    # 2. Feature engineering
    logger.info("\n[2/5] Engineering features...")
    engineer = FeatureEngineer()
    df = engineer.engineer(df)
    feature_names = engineer.get_feature_names()
    
    # 3. Time-based train/val/test split
    logger.info("\n[3/5] Splitting dataset (time-based, no leakage)...")
    train_df, val_df, test_df = time_based_split(
        df,
        train_frac=0.6,
        val_frac=0.2
    )
    
    # Separate features and labels
    X_train = train_df[feature_names]
    y_train = train_df['isFraud']
    
    X_val = val_df[feature_names]
    y_val = val_df['isFraud']
    
    X_test = test_df[feature_names]
    y_test = test_df['isFraud']
    
    logger.info(f"Train: {len(X_train)} ({y_train.mean():.2%} fraud)")
    logger.info(f"Val:   {len(X_val)} ({y_val.mean():.2%} fraud)")
    logger.info(f"Test:  {len(X_test)} ({y_test.mean():.2%} fraud)")
    
    # 4. Train ensemble model
    logger.info("\n[4/5] Training ensemble model...")
    model_id = f"paysim_ensemble_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    model = EnsembleModel(
        model_id=model_id,
        w_supervised=0.7,
        w_unsupervised=0.3,
        threshold_flag=0.5,    # Flag for review
        threshold_block=0.8    # Block transaction
    )
    
    model.train(
        X_train, y_train,
        X_val, y_val,
        feature_names=feature_names
    )
    
    # 5. Evaluate model
    logger.info("\n[5/5] Evaluating model...")
    metrics = model.evaluate(X_test, y_test)
    
    # Save model
    model_path = model.save()
    
    # Save training metadata
    metadata = {
        'model_id': model_id,
        'pipeline_version': '1.0',
        'trained_at': datetime.utcnow().isoformat(),
        'dataset_hash': dataset_hash,
        'dataset_size': len(df),
        'train_samples': len(X_train),
        'val_samples': len(X_val),
        'test_samples': len(X_test),
        'feature_count': len(feature_names),
        'feature_names': feature_names,
        'metrics': metrics,
        'model_path': model_path
    }
    
    metadata_path = Path(model_path) / "training_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logger.info("\n" + "=" * 80)
    logger.info("TRAINING COMPLETE")
    logger.info("=" * 80)
    logger.info(f"Model ID: {model_id}")
    logger.info(f"Model saved to: {model_path}")
    logger.info(f"Metrics: {json.dumps(metrics, indent=2)}")
    
    return True


if __name__ == "__main__":
    success = run_training_pipeline()
    sys.exit(0 if success else 1)
