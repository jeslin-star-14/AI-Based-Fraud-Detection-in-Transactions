from fastapi import APIRouter, Query
from pydantic import BaseModel
from datetime import datetime
from typing import List

router = APIRouter()

class Transaction(BaseModel):
    id: int
    user_id: int
    amount: float
    merchant: str
    timestamp: datetime
    location: str
    status: str
    is_fraudulent: bool

class TransactionResponse(BaseModel):
    total: int
    transactions: List[Transaction]

# Mock data
mock_transactions = [
    {
        "id": 1,
        "user_id": 101,
        "amount": 125.50,
        "merchant": "Amazon",
        "timestamp": datetime.now(),
        "location": "New York, NY",
        "status": "completed",
        "is_fraudulent": False
    },
    {
        "id": 2,
        "user_id": 102,
        "amount": 2500.00,
        "merchant": "Unknown Store",
        "timestamp": datetime.now(),
        "location": "Moscow, Russia",
        "status": "flagged",
        "is_fraudulent": True
    },
    {
        "id": 3,
        "user_id": 101,
        "amount": 45.99,
        "merchant": "Starbucks",
        "timestamp": datetime.now(),
        "location": "Chicago, IL",
        "status": "completed",
        "is_fraudulent": False
    }
]

@router.get("/")
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Get all transactions with pagination
    """
    transactions = mock_transactions[skip:skip + limit]
    return {
        "total": len(mock_transactions),
        "transactions": transactions,
        "skip": skip,
        "limit": limit
    }

@router.get("/{transaction_id}")
async def get_transaction(transaction_id: int):
    """
    Get a specific transaction by ID
    """
    for tx in mock_transactions:
        if tx["id"] == transaction_id:
            return tx
    return {"error": "Transaction not found"}

@router.post("/")
async def create_transaction(transaction: Transaction):
    """
    Create a new transaction
    """
    return {
        "message": "Transaction created",
        "transaction": transaction
    }

@router.put("/{transaction_id}")
async def update_transaction(transaction_id: int, transaction: Transaction):
    """
    Update a transaction
    """
    return {
        "message": "Transaction updated",
        "id": transaction_id,
        "transaction": transaction
    }
