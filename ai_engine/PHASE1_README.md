# PHASE 1: REAL DATA AND TRAINING

## Overview

This phase replaces synthetic data with **PaySim**, a real-world public dataset, and implements a production-grade ML pipeline with:

- Real dataset loading with PaySim (Kaggle)
- Feature engineering from account history (velocity, recency, behavioral)
- Time-based train/val/test split (no leakage)
- Supervised (XGBoost) + Unsupervised (Isolation Forest) ensemble
- SHAP explainability for predictions
- Model versioning and registry
- Comprehensive evaluation metrics (PR-AUC, confusion matrix)

## Dataset: Why PaySim?

**PaySim** is chosen over the ULB Kaggle credit-card dataset because:

| Aspect | PaySim | ULB Credit-Card |
|--------|--------|-----------------|
| Account ID | ✅ Yes | ❌ No (anonymized) |
| Timestamp | ✅ Yes (transaction order) | ❌ No (sequenced) |
| Transaction Type | ✅ Yes (PAYMENT, TRANSFER, etc.) | ❌ No |
| Account Balance | ✅ Yes | ❌ No |
| Velocity Features | ✅ Possible | ❌ Not possible |
| History Features | ✅ Possible | ❌ Not possible |
| Realistic | ✅ Based on real patterns | ⚠️ PCA-transformed, artificial |

**PaySim** dataset: https://www.kaggle.com/datasets/ealaxi/paysim1
- ~6.3M transactions
- ~4.2% fraud rate (realistic)
- Account-based history enables behavioral features

## Setup

### 1. Install Dependencies

```bash
cd ai_engine
pip install -r requirements.txt
```

### 2. Download PaySim Dataset

```bash
# Install Kaggle CLI
pip install kaggle

# Download dataset (requires Kaggle account)
kaggle datasets download -d ealaxi/paysim1 -p ai_engine/data/raw

# Unzip
cd ai_engine/data/raw
unzip paysim1.zip
ls *.csv
```

Expected file: `PS_20174392719_1491204840751_log.csv` (~350 MB)

### 3. Run Training Pipeline

```bash
cd /path/to/project/root
python ai_engine/train_pipeline.py
```

## Pipeline Steps

### Step 1: Data Loading (`data_loader.py`)

Loads PaySim CSV, validates schema, prints statistics.

```python
from ai_engine.data_loader import load_paysim
df = load_paysim()
print(df.shape)  # (6362620, 11)
print(df['isFraud'].mean())  # ~0.0013 (0.13% fraud rate)
```

### Step 2: Feature Engineering (`preprocessing/feature_engineer.py`)

Computes behavioral features from account history:

1. **Velocity**: Transaction count in 1h and 24h windows per account
2. **Amount Statistics**: Mean and std of transaction amounts per account
3. **Amount Z-Score**: How far is this amount from the account's typical behavior
4. **Time Since Last Tx**: Hours since this account's last transaction
5. **New Recipient**: First time sending to this destination
6. **Balance Drain Ratio**: (old_balance - new_balance) / old_balance
7. **Transaction Type**: One-hot encoded
8. **Cyclic Time**: Hour of day and day of week (sin/cos encoded)
9. **Log Amount**: Log scale of transaction amount

All features are **account-aware** (velocity, recency, history-based), enabling anomaly detection.

```python
from ai_engine.preprocessing.feature_engineer import FeatureEngineer
engineer = FeatureEngineer()
df_engineered = engineer.engineer(df)
print(engineer.get_feature_names())
# ['velocity_1h', 'velocity_24h', 'amount_mean_per_account', ...]
```

### Step 3: Time-Based Split

Splits dataset chronologically to avoid leakage:

```python
from ai_engine.preprocessing.feature_engineer import time_based_split

train_df, val_df, test_df = time_based_split(df_engineered, train_frac=0.6, val_frac=0.2)
# 60% train, 20% val, 20% test
# No future data in training
```

### Step 4: Model Training (`models/ensemble_model.py`)

Trains two models:

#### XGBoost (Supervised)
- Learns fraud patterns from labels
- Outputs probability of fraud (0-1)
- Early stopping on validation set

#### Isolation Forest (Unsupervised)
- Detects anomalies without labels
- Isolated points = likely fraud
- Outputs anomaly score (0-1)

#### Ensemble
```
risk_score = 0.7 * supervised_score + 0.3 * unsupervised_score
```

Thresholds:
- **FLAG**: risk_score >= 0.5 (review by analyst)
- **BLOCK**: risk_score >= 0.8 (automatic block)

```python
from ai_engine.models.ensemble_model import EnsembleModel

model = EnsembleModel(
    model_id="paysim_ensemble_v1",
    w_supervised=0.7,
    w_unsupervised=0.3,
    threshold_flag=0.5,
    threshold_block=0.8
)

model.train(X_train, y_train, X_val, y_val)
metrics = model.evaluate(X_test, y_test)
model.save()
```

### Step 5: Evaluation

Metrics computed on test set:

- **Precision**: Of flagged transactions, how many are actually fraud?
- **Recall**: Of all fraud, how many do we catch?
- **F1**: Harmonic mean of precision and recall
- **PR-AUC**: Area under precision-recall curve (better for imbalanced data)
- **ROC-AUC**: For reference
- **Confusion Matrix**: TP, FP, FN, TN

Example output:
```
Model evaluation (threshold=0.5):
  Precision: 0.8234
  Recall: 0.7891
  F1: 0.8060
  PR-AUC: 0.8123
  ROC-AUC: 0.9234
  Confusion: TP=1543 FP=325 FN=185 TN=98765
```

### Step 6: SHAP Explainability

For each prediction, SHAP values explain which features contributed most:

```python
preds = model.predict(X_test)
shap_values = preds['shap_values']  # shape: (n_samples, n_features)

# For a sample:
import shap
shap.summary_plot(shap_values, X_test)  # visualize feature importance
```

### Step 7: Model Registry (`model_registry.py`)

Manages versioned models:

```python
from ai_engine.model_registry import ModelRegistry

registry = ModelRegistry()

# List all versions
models = registry.list_models()
for m in models:
    print(m['model_id'])

# Load active model
model = registry.get_active_model()

# Promote a version to active
registry.promote_model("paysim_ensemble_20240101_120000")

# Compare models
comparison = registry.compare_models()
```

Active model is tracked in `ai_engine/models/saved_models/active.json`.

## Running the Full Pipeline

```bash
cd /path/to/project/root

# Install dependencies
pip install -r ai_engine/requirements.txt

# Download dataset (one-time)
kaggle datasets download -d ealaxi/paysim1 -p ai_engine/data/raw
cd ai_engine/data/raw && unzip paysim1.zip && cd ../..

# Run training
python ai_engine/train_pipeline.py
```

Expected output:
```
INFO - Loading PaySim dataset...
INFO - Loaded 6362620 transactions
INFO - Fraud rate: 0.13%

INFO - Engineering features from account history...
INFO - Engineered 23 features

INFO - Time-based split: train=60% (3817572), val=20% (1272874), test=20% (1272174)

INFO - Training ensemble model...
INFO - Training XGBoost...
INFO - XGBoost training accuracy: 0.9987
INFO - Training Isolation Forest...

INFO - Building SHAP explainer...

INFO - Evaluating model...
Model evaluation (threshold=0.5):
  Precision: 0.8234
  Recall: 0.7891
  F1: 0.8060
  PR-AUC: 0.8123
  ROC-AUC: 0.9234

INFO - Model saved to ai_engine/models/saved_models/paysim_ensemble_20240101_120000
```

## Files Created / Modified

### New Files
- `ai_engine/data_loader.py` - PaySim loader
- `ai_engine/preprocessing/feature_engineer.py` - Feature engineering + time-based split
- `ai_engine/models/ensemble_model.py` - XGBoost + Isolation Forest ensemble
- `ai_engine/train_pipeline.py` - Main training script (executable)
- `ai_engine/model_registry.py` - Model versioning and promotion
- `ai_engine/requirements.txt` - Dependencies
- `ai_engine/PHASE1_README.md` - This file

### Model Artifacts (created after training)
```
ai_engine/models/saved_models/
  paysim_ensemble_20240101_120000/
    xgb_model.pkl
    iso_forest.pkl
    scaler.pkl
    metadata.json
    training_metadata.json
  active.json  <- points to active model
```

## Key Principles

1. **No Hardcoded Data**: Every number comes from the model or database
2. **No Leakage**: Time-based split ensures future data never in training
3. **Account History**: All behavioral features are per-account
4. **Ensemble**: Combines supervised (labeled) + unsupervised (anomaly) signals
5. **Explainability**: SHAP values for every prediction
6. **Versioning**: Every trained model is saved with metadata and metrics
7. **Evaluation**: Precision-recall AUC, not just accuracy (imbalanced data)

## Next Steps (Phase 2)

Phase 2 will:
- Set up PostgreSQL database
- Create backend API to score incoming transactions in real-time
- Integrate this trained model into the backend
- Implement analyst feedback loop for retraining

## Troubleshooting

**"PaySim dataset not found"**
- Run: `kaggle datasets download -d ealaxi/paysim1 -p ai_engine/data/raw`
- Verify: `ls ai_engine/data/raw/PS_*.csv`

**"XGBoost import error"**
- Run: `pip install xgboost`

**"SHAP error"**
- Run: `pip install shap`

**Dataset too large for memory**
- Use a smaller subset or increase RAM
- Alternatively, stream in batches (Phase 2 backend will do this)

## References

- PaySim Paper: https://arxiv.org/abs/1605.07492
- SHAP: https://github.com/slundberg/shap
- XGBoost: https://xgboost.readthedocs.io
- Isolation Forest: https://scikit-learn.org/stable/modules/ensemble.html#isolation-forest
