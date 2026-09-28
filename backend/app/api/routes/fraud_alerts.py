from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from typing import List

router = APIRouter()

class Alert(BaseModel):
    id: int
    transaction_id: int
    risk_level: str
    reason: str
    timestamp: datetime
    action_taken: str

# Mock data
mock_alerts = [
    {
        "id": 1,
        "transaction_id": 2,
        "risk_level": "high",
        "reason": "Transaction from unusual location",
        "timestamp": datetime.now(),
        "action_taken": "blocked"
    },
    {
        "id": 2,
        "transaction_id": 5,
        "risk_level": "medium",
        "reason": "Suspicious pattern detected",
        "timestamp": datetime.now(),
        "action_taken": "flagged"
    }
]

@router.get("/")
async def get_fraud_alerts():
    """
    Get all fraud alerts
    """
    return {
        "total": len(mock_alerts),
        "alerts": mock_alerts
    }

@router.get("/{alert_id}")
async def get_alert(alert_id: int):
    """
    Get a specific alert by ID
    """
    for alert in mock_alerts:
        if alert["id"] == alert_id:
            return alert
    return {"error": "Alert not found"}

@router.post("/")
async def create_alert(alert: Alert):
    """
    Create a new fraud alert
    """
    return {
        "message": "Alert created",
        "alert": alert
    }

@router.put("/{alert_id}/resolve")
async def resolve_alert(alert_id: int):
    """
    Resolve a fraud alert
    """
    return {
        "message": "Alert resolved",
        "alert_id": alert_id
    }
