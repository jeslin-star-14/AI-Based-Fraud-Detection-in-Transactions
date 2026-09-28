"""
Core transaction ingestion and scoring service.

Responsibilities:
1. Ingest raw transaction
2. Compute features from account history (stored in DB)
3. Score with loaded model
4. Save transaction + prediction
5. Create alert if needed
6. Ensure idempotency
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from sqlalchemy.orm import Session

from ai_engine.models.ensemble_model import EnsembleModel
from ai_engine.model_registry import ModelRegistry
from backend.app.database.models import (
    Transaction, Prediction, Alert, Account, TransactionType, AlertStatus
)
from backend.app.schemas import TransactionIngestRequest

logger = logging.getLogger(__name__)

# Global model (loaded at startup)
_loaded_model: Optional[EnsembleModel] = None
_model_registry: Optional[ModelRegistry] = None


def load_model():
    """Load active model from registry."""
    global _loaded_model, _model_registry
    logger.info("Loading active model from registry...")
    _model_registry = ModelRegistry()
    _loaded_model = _model_registry.get_active_model()
    if _loaded_model is None:
        raise RuntimeError("No active model in registry. Run training pipeline first.")
    logger.info(f"Model loaded: {_loaded_model.model_id}")


def get_model() -> EnsembleModel:
    """Get loaded model, raise if not loaded."""
    if _loaded_model is None:
        raise RuntimeError("Model not loaded. Call load_model() at startup.")
    return _loaded_model


def compute_account_features(
    db: Session,
    account_id: int,
    current_timestamp: datetime
) -> Dict:
    """
    Compute behavioral features from account's transaction history.
    
    Features:
    - velocity_1h: transactions in last 1 hour
    - velocity_24h: transactions in last 24 hours
    - amount_mean_per_account: average amount sent
    - amount_std_per_account: std of amounts sent
    - time_since_last_tx: hours since last transaction
    """
    
    # Query transactions for this account in last 24 hours
    cutoff_24h = current_timestamp - timedelta(hours=24)
    cutoff_1h = current_timestamp - timedelta(hours=1)
    
    txs_24h = db.query(Transaction).filter(
        Transaction.origin_account_id == account_id,
        Transaction.timestamp >= cutoff_24h
    ).all()
    
    txs_1h = [tx for tx in txs_24h if tx.timestamp >= cutoff_1h]
    
    # Velocity
    velocity_1h = len(txs_1h)
    velocity_24h = len(txs_24h)
    
    # Amount statistics
    amounts = [tx.amount for tx in txs_24h]
    if amounts:
        import numpy as np
        amount_mean = float(np.mean(amounts))
        amount_std = float(np.std(amounts))
    else:
        amount_mean = 0.0
        amount_std = 0.0
    
    # Time since last transaction
    if txs_24h:
        last_tx = sorted(txs_24h, key=lambda x: x.timestamp)[-1]
        time_since_last = (current_timestamp - last_tx.timestamp).total_seconds() / 3600
    else:
        time_since_last = 0.0
    
    return {
        'velocity_1h': velocity_1h,
        'velocity_24h': velocity_24h,
        'amount_mean_per_account': amount_mean,
        'amount_std_per_account': amount_std,
        'time_since_last_tx': time_since_last
    }


def ingest_transaction(
    db: Session,
    request: TransactionIngestRequest
) -> Dict:
    """
    Ingest and score a transaction.
    
    Idempotent: if transaction_id already exists, return cached prediction.
    """
    
    # Check idempotency: does this transaction already exist?
    existing = db.query(Transaction).filter(
        Transaction.transaction_id == request.transaction_id
    ).first()
    
    if existing:
        logger.info(f"Transaction {request.transaction_id} already ingested")
        prediction = existing.prediction
        return {
            'transaction_id': existing.transaction_id,
            'risk_score': prediction.risk_score,
            'flagged': prediction.flagged,
            'blocked': prediction.blocked,
            'cached': True
        }
    
    logger.info(f"Ingesting transaction {request.transaction_id}")
    
    # Get or create accounts
    origin_account = db.query(Account).filter(
        Account.account_id == request.origin_account_id
    ).first()
    if not origin_account:
        origin_account = Account(
            account_id=request.origin_account_id,
            account_name=request.origin_account_id
        )
        db.add(origin_account)
        db.flush()
    
    dest_account = db.query(Account).filter(
        Account.account_id == request.dest_account_id
    ).first()
    if not dest_account:
        dest_account = Account(
            account_id=request.dest_account_id,
            account_name=request.dest_account_id
        )
        db.add(dest_account)
        db.flush()
    
    # Create transaction record
    transaction = Transaction(
        transaction_id=request.transaction_id,
        origin_account_id=origin_account.id,
        dest_account_id=dest_account.id,
        transaction_type=request.transaction_type,
        amount=request.amount,
        old_balance_origin=request.old_balance_origin,
        new_balance_origin=request.new_balance_origin,
        old_balance_dest=request.old_balance_dest,
        new_balance_dest=request.new_balance_dest,
        timestamp=request.timestamp
    )
    
    db.add(transaction)
    db.flush()  # flush to get transaction ID before scoring
    
    # Compute features
    account_features = compute_account_features(
        db, origin_account.id, request.timestamp
    )
    
    # Score transaction
    model = get_model()
    
    # Prepare feature vector (must match training features)
    import pandas as pd
    feature_dict = {
        'velocity_1h': [account_features['velocity_1h']],
        'velocity_24h': [account_features['velocity_24h']],
        'amount_mean_per_account': [account_features['amount_mean_per_account']],
        'amount_std_per_account': [account_features['amount_std_per_account']],
        'time_since_last_tx': [account_features['time_since_last_tx']],
        'amount_zscore': [(request.amount - account_features['amount_mean_per_account']) / (account_features['amount_std_per_account'] + 1e-6)],
        'new_recipient': [1.0],  # Simplified: assume new if not in DB yet
        'balance_drain_ratio': [(request.old_balance_origin - request.new_balance_origin) / (request.old_balance_origin + 1e-6) if request.old_balance_origin > 0 else 0.0],
        'log_amount': [float(__import__('numpy').log1p(request.amount))],
        'hour_sin': [0.0],  # Simplified
        'hour_cos': [1.0],
        'day_sin': [0.0],
        'day_cos': [1.0],
        # Transaction type (one-hot)
        'type_PAYMENT': [1.0 if request.transaction_type == TransactionType.PAYMENT else 0.0],
        'type_TRANSFER': [1.0 if request.transaction_type == TransactionType.TRANSFER else 0.0],
        'type_CASH_IN': [1.0 if request.transaction_type == TransactionType.CASH_IN else 0.0],
        'type_CASH_OUT': [1.0 if request.transaction_type == TransactionType.CASH_OUT else 0.0],
        'type_DEBIT': [1.0 if request.transaction_type == TransactionType.DEBIT else 0.0],
    }
    
    X = pd.DataFrame(feature_dict)
    preds = model.predict(X)
    
    risk_score = float(preds['risk_score'][0])
    supervised_score = float(preds['supervised_score'][0])
    unsupervised_score = float(preds['unsupervised_score'][0])
    flagged = bool(preds['flag'][0])
    blocked = bool(preds['block'][0])
    shap_values = preds['shap_values'][0].tolist()  # Convert to list for JSON serialization
    
    # Create prediction record
    prediction = Prediction(
        transaction_id=transaction.id,
        model_version=model.model_id,
        risk_score=risk_score,
        supervised_score=supervised_score,
        unsupervised_score=unsupervised_score,
        flagged=flagged,
        blocked=blocked,
        shap_values={name: float(val) for name, val in zip(model.feature_names, shap_values)}
    )
    
    db.add(prediction)
    db.flush()
    
    # Create alert if flagged
    if flagged:
        priority = "high" if blocked else "medium"
        alert = Alert(
            transaction_id=transaction.id,
            prediction_id=prediction.id,
            status=AlertStatus.OPEN,
            priority=priority
        )
        db.add(alert)
        logger.warning(f"Alert created for transaction {transaction.transaction_id} (risk={risk_score:.4f})")
    
    # Commit
    db.commit()
    
    logger.info(
        f"Transaction {request.transaction_id} scored: "
        f"risk={risk_score:.4f}, flagged={flagged}, blocked={blocked}"
    )
    
    return {
        'transaction_id': request.transaction_id,
        'risk_score': risk_score,
        'flagged': flagged,
        'blocked': blocked,
        'cached': False
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Transaction service module ready.")
