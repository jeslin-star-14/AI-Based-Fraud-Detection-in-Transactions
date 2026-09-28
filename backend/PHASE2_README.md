# PHASE 2: REAL BACKEND

## Overview

Production-grade FastAPI backend with PostgreSQL, real transaction scoring, analyst feedback loop, and dashboard metrics.

### Architecture

```
Transaction → API → Service (compute features) → Model Score → DB
                                                      ↓
                                                  Prediction
                                                      ↓
                                                  Alert (if flagged)
                                                      ↓
                                                  Analyst Review → Feedback
```

## Database Schema

### Tables

1. **users**: Analysts and admins with roles
2. **accounts**: Source and destination accounts
3. **transactions**: Raw transaction data
4. **predictions**: Model scores, SHAP values, flagged/blocked status
5. **alerts**: Flagged transactions requiring review
6. **analyst_reviews**: Analyst feedback (fraud/legitimate)
7. **audit_log**: Compliance audit trail

### Key Features

- All columns indexed for fast queries
- Foreign key relationships
- Enum types for status/role
- Timestamps on all records (created_at, updated_at)

## API Endpoints

### Transactions

```
POST /api/transactions/ingest
  Request: {
    "transaction_id": "tx_123",
    "origin_account_id": "acc_001",
    "dest_account_id": "acc_002",
    "transaction_type": "TRANSFER",
    "amount": 1000.0,
    "old_balance_origin": 5000.0,
    "new_balance_origin": 4000.0,
    "timestamp": "2024-01-15T10:30:00Z"
  }
  Response: {
    "transaction_id": "tx_123",
    "risk_score": 0.65,
    "flagged": true,
    "blocked": false,
    "cached": false
  }

GET /api/transactions/{transaction_id}
  Response: {
    "transaction_id": "tx_123",
    "amount": 1000.0,
    "timestamp": "2024-01-15T10:30:00Z",
    "prediction": {
      "risk_score": 0.65,
      "flagged": true,
      "blocked": false,
      "shap_values": {...}
    }
  }
```

### Alerts

```
GET /api/alerts/?status=open&skip=0&limit=100
  Response: [
    {
      "alert_id": 1,
      "transaction_id": "tx_123",
      "risk_score": 0.65,
      "status": "open",
      "priority": "medium",
      "origin_account_id": "acc_001",
      "dest_account_id": "acc_002",
      "amount": 1000.0,
      "timestamp": "2024-01-15T10:30:00Z",
      "notes": null
    }
  ]

POST /api/alerts/{alert_id}/review
  Request: {
    "is_fraud": true,
    "confidence": 0.95,
    "notes": "Similar pattern to recent fraud ring"
  }
  Response: {
    "alert_id": 1,
    "status": "reviewed"
  }

POST /api/alerts/{alert_id}/assign
  Request: {
    "analyst_id": 5
  }
```

### Dashboard

```
GET /api/dashboard/metrics?hours=24
  Response: {
    "total_transactions": 50000,
    "flagged_count": 250,
    "blocked_count": 12,
    "fraud_confirmed_count": 198,
    "false_positive_count": 52,
    "model_version": "paysim_ensemble_20240115_...",
    "accuracy_from_feedback": 0.792
  }

GET /api/dashboard/alerts/timeline?hours=24
GET /api/dashboard/transactions/by-type?hours=24
GET /api/dashboard/risk-distribution?hours=24
```

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
pip install psycopg2-binary  # PostgreSQL driver
```

### 2. PostgreSQL Setup

```bash
# Install PostgreSQL (macOS)
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create user and database
psql postgres
CREATE USER fraud_user WITH PASSWORD 'fraud_pass';
CREATE DATABASE fraud_detection OWNER fraud_user;
GRANT ALL PRIVILEGES ON DATABASE fraud_detection TO fraud_user;
\q
```

### 3. Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Initialize Database

```bash
python backend/app/database/db.py
```

### 5. Run Backend

```bash
# Set Python path
export PYTHONPATH=/path/to/project:$PYTHONPATH

# Run server
python -m uvicorn backend.app.main_new:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Test API

```bash
# Health check
curl http://localhost:8000/health

# Readiness
curl http://localhost:8000/readiness

# Ingest transaction
curl -X POST http://localhost:8000/api/transactions/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx_001",
    "origin_account_id": "acc_001",
    "dest_account_id": "acc_002",
    "transaction_type": "TRANSFER",
    "amount": 1500.0,
    "old_balance_origin": 5000.0,
    "new_balance_origin": 3500.0,
    "old_balance_dest": 1000.0,
    "new_balance_dest": 2500.0,
    "timestamp": "2024-01-15T10:30:00Z"
  }'

# List alerts
curl http://localhost:8000/api/alerts/

# Dashboard metrics
curl http://localhost:8000/api/dashboard/metrics?hours=24
```

## Key Components

### Transaction Ingest Service (`services/transaction_service.py`)

1. **Idempotency**: Check if transaction_id already exists
2. **Feature Computation**: Pull account history from DB, compute features
3. **Scoring**: Load model, predict risk score
4. **Alert Creation**: If flagged, create alert record
5. **Atomicity**: All-or-nothing commit to DB

```python
from backend.app.services.transaction_service import ingest_transaction

result = ingest_transaction(db, request)
# {
#   'transaction_id': 'tx_001',
#   'risk_score': 0.65,
#   'flagged': True,
#   'blocked': False,
#   'cached': False
# }
```

### Features Computed at Ingest

- **velocity_1h**: Transactions from this account in last 1 hour
- **velocity_24h**: Transactions from this account in last 24 hours
- **amount_mean_per_account**: Average transaction amount for this account
- **amount_std_per_account**: Standard deviation of amounts
- **time_since_last_tx**: Hours since this account's last transaction
- **amount_zscore**: How far is this amount from account's mean
- **new_recipient**: First time sending to this destination?
- **balance_drain_ratio**: (old - new) / old balance
- **transaction_type**: One-hot encoded (PAYMENT, TRANSFER, etc.)
- **cyclic_time**: Hour of day and day of week (sin/cos encoded)

### Model Loading

At startup, backend loads the **active model** from the model registry:

```python
from ai_engine.model_registry import ModelRegistry

registry = ModelRegistry()
model = registry.get_active_model()
# Loads: xgb_model, iso_forest, scaler, metadata
```

If no active model set, backend fails loudly at startup (fails_loudly: ✓).

### Analyst Feedback Loop

1. Analyst reviews alert: `/api/alerts/{id}/review`
2. Feedback stored in `analyst_reviews` table
3. Feedback is labeled data for retraining
4. Model retrains periodically with new feedback (Phase 1 extends to include feedback)

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@host:5432/db
SQL_ECHO=false                    # Log SQL queries

BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=false

CORS_ORIGINS=http://localhost:3000

JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=30

ANTHROPIC_API_KEY=sk-ant-...     # For Phase 3
LLM_MODEL=claude-3-opus-...
```

## Performance Notes

- **Indexes**: All frequently-queried columns are indexed (account_id, timestamp, risk_score, status)
- **Connection Pooling**: SQLAlchemy pool_size=20, max_overflow=40
- **Model Serving**: Model loaded once at startup, reused for all scoring
- **Idempotency**: Prevents duplicate processing if webhooks retry

## Files Created / Modified

### New Files
- `backend/app/database/models.py` - SQLAlchemy ORM models
- `backend/app/database/db.py` - Database setup and sessions
- `backend/app/schemas.py` - Pydantic request/response schemas
- `backend/app/services/transaction_service.py` - Scoring service
- `backend/app/api/routes/transactions_new.py` - Transaction endpoints
- `backend/app/api/routes/alerts_new.py` - Alert management endpoints
- `backend/app/api/routes/dashboard_new.py` - Dashboard analytics
- `backend/app/main_new.py` - FastAPI app with startup/shutdown
- `backend/.env.example` - Configuration template
- `backend/PHASE2_README.md` - This file

### Requirements
- `backend/requirements.txt` - Updated with psycopg2-binary

## Next Steps (Phase 3)

- Implement JWT authentication for API routes
- Add background worker for batch scoring
- Implement WebSocket for real-time updates to frontend
- Integrate Anthropic API for LLM-based agent

## Troubleshooting

**"Database connection failed"**
- Verify PostgreSQL is running: `brew services list`
- Check DATABASE_URL in .env
- Verify database exists: `psql fraud_detection`

**"Model not loaded"**
- Run training pipeline: `python ai_engine/train_pipeline.py`
- Verify model path: `ls ai_engine/models/saved_models/`
- Verify active.json: `cat ai_engine/models/saved_models/active.json`

**"Feature vector mismatch"**
- Ensure features in scoring match features from training
- Check feature names in model metadata
- Verify train_pipeline.py produced the model

**Slow queries**
- Check indexes exist: `\d transactions` in psql
- Verify connection pool settings
- Consider pagination for large result sets
