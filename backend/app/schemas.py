"""
Pydantic schemas for API requests/responses.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum

from backend.app.database.models import TransactionType, AlertStatus


class TransactionIngestRequest(BaseModel):
    """Ingest a transaction for scoring."""
    transaction_id: str = Field(..., description="Unique transaction identifier (idempotency key)")
    origin_account_id: str
    dest_account_id: str
    transaction_type: TransactionType
    amount: float = Field(..., gt=0)
    old_balance_origin: Optional[float] = None
    new_balance_origin: Optional[float] = None
    old_balance_dest: Optional[float] = None
    new_balance_dest: Optional[float] = None
    timestamp: datetime

    @validator('transaction_id')
    def transaction_id_not_empty(cls, v):
        if not v.strip():
            raise ValueError("transaction_id cannot be empty")
        return v


class TransactionResponse(BaseModel):
    """Transaction with prediction."""
    transaction_id: str
    risk_score: float
    flagged: bool
    blocked: bool
    cached: bool

    class Config:
        from_attributes = True


class AlertDetail(BaseModel):
    """Alert details for analyst."""
    alert_id: int
    transaction_id: str
    risk_score: float
    status: AlertStatus
    priority: str
    origin_account_id: str
    dest_account_id: str
    amount: float
    timestamp: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class AnalystReviewRequest(BaseModel):
    """Analyst feedback on an alert."""
    alert_id: int
    is_fraud: bool
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    notes: Optional[str] = None


class DashboardMetrics(BaseModel):
    """Dashboard summary metrics."""
    total_transactions: int
    flagged_count: int
    blocked_count: int
    fraud_confirmed_count: int
    false_positive_count: int
    model_version: str
    accuracy_from_feedback: Optional[float] = None

    class Config:
        from_attributes = True


class AuthToken(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class WebhookSignatureRequest(BaseModel):
    """Webhook from payment gateway."""
    event_id: str
    timestamp: datetime
    transaction: Dict[str, Any]
    signature: str  # HMAC signature
