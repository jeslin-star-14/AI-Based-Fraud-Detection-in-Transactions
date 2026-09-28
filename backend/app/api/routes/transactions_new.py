"""
Transaction API endpoints.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.db import get_db
from backend.app.schemas import TransactionIngestRequest, TransactionResponse
from backend.app.services.transaction_service import ingest_transaction

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/ingest", response_model=TransactionResponse)
async def ingest_transaction_endpoint(
    request: TransactionIngestRequest,
    db: Session = Depends(get_db)
):
    """
    Ingest and score a transaction.
    
    Idempotent: same transaction_id returns cached result.
    """
    try:
        result = ingest_transaction(db, request)
        return TransactionResponse(**result)
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        logger.error(f"Runtime error: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/{transaction_id}")
async def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    """Retrieve a transaction and its prediction."""
    from backend.app.database.models import Transaction
    
    tx = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {
        'transaction_id': tx.transaction_id,
        'amount': tx.amount,
        'timestamp': tx.timestamp,
        'prediction': {
            'risk_score': tx.prediction.risk_score if tx.prediction else None,
            'flagged': tx.prediction.flagged if tx.prediction else None,
            'blocked': tx.prediction.blocked if tx.prediction else None,
            'shap_values': tx.prediction.shap_values if tx.prediction else None
        }
    }
