from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.services import transaction_service
from app.schemas.transaction_schema import TransactionStatusUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
def list_transactions(status: Optional[str] = Query(default=None)):
    return transaction_service.get_all(status)


@router.get("/{txn_id}")
def get_transaction(txn_id: str):
    txn = transaction_service.get_by_id(txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction {txn_id} not found")
    return txn


@router.patch("/{txn_id}")
def update_transaction(txn_id: str, body: TransactionStatusUpdate):
    txn = transaction_service.update_status(txn_id, body.status)
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction {txn_id} not found")
    return txn
