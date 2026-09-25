# ai_engine — Fraud Detection Models

Trains and evaluates the anomaly detection and clustering models used by
the backend to score transactions. Fully standalone — no need to run the
backend or frontend to use this module on its own.

## Structure
```
ai_engine/
├── data_generator.py          # synthetic transaction dataset
├── preprocessing/
│   ├── data_cleaning.py       # dedup, range validation, missing-value handling
│   ├── feature_engineering.py # FEATURES list + feature derivation (single source of truth)
│   └── scaler_utils.py        # fit/save/load StandardScaler
├── models/
│   ├── anomaly_detection/
│   │   ├── isolation_forest_model.py   # production model
│   │   └── one_class_svm_model.py      # comparison baseline
│   ├── clustering/
│   │   ├── kmeans_model.py             # production model
│   │   └── dbscan_model.py             # comparison baseline
│   └── saved_models/           # trained .pkl files land here
├── evaluation/
│   ├── metrics.py               # precision/recall/F1/ROC-AUC/confusion matrix
│   └── model_comparison.py      # runs both algorithms side by side
└── train_pipeline.py            # orchestrates all of the above
```

## Setup
```bash
cd ai_engine
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Train the production models
```bash
python train_pipeline.py
```
Saves `isolation_forest.pkl`, `kmeans.pkl`, `scaler.pkl`, `metrics.pkl`,
and `scoring_config.pkl` into `models/saved_models/`. These are exactly
the files `backend/app/services/fraud_service.py` loads — nothing else
needs to change if you retrain.

## Train + compare against alternative algorithms
```bash
python train_pipeline.py --compare
```
Additionally runs Isolation Forest vs. One-Class SVM, and KMeans vs.
DBSCAN, printing precision/recall/F1/ROC-AUC and clustering quality for
each. Use this output directly in your report's "why we chose these
algorithms" section.

## Why these models (for your report)
- **Isolation Forest** (anomaly detection): unsupervised, so it doesn't
  need labeled fraud examples to train — realistic, since confirmed
  fraud labels are scarce and arrive late. Gives a continuous anomaly
  score rather than a hard 0/1 call, which is what becomes the 0–100
  risk score shown in the dashboard.
- **One-Class SVM** is kept as a comparison baseline: can model more
  complex boundaries but is more hyperparameter-sensitive and scales
  worse, which `evaluation/model_comparison.py` demonstrates empirically.
- **KMeans** (clustering): fast, deterministic, and produces a fixed
  number of interpretable behavioral groups (e.g. "high-velocity card
  testing") that the AI agent references when explaining a flagged
  transaction.
- **DBSCAN** is the comparison baseline: doesn't require picking `k`
  upfront and naturally labels sparse outliers as noise, but is more
  sensitive to density parameters — also demonstrated in the comparison
  report.

## Using this module elsewhere (e.g. from the backend)
```python
from preprocessing.feature_engineering import FEATURES, to_vector
from models.anomaly_detection.isolation_forest_model import IsolationForestModel
from preprocessing.scaler_utils import load_scaler

scaler = load_scaler("models/saved_models/scaler.pkl")
model = IsolationForestModel.load("models/saved_models/isolation_forest.pkl")

X = [to_vector(features_dict)]
X_scaled = scaler.transform(X)
risk_score = model.anomaly_scores(X_scaled)[0]
```
