"""
Alerts API: list, review, and manage flagged transactions.
"""

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.db import get_db
from backend.app.database.models import Alert, AnalystReview, AlertStatus
from backend.app.schemas import AlertDetail, AnalystReviewRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[AlertDetail])
async def list_alerts(
    status_filter: AlertStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List open alerts."""
    query = db.query(Alert)
    
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    else:
        query = query.filter(Alert.status == AlertStatus.OPEN)
    
    alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
    
    return [AlertDetail(
        alert_id=a.id,
        transaction_id=a.transaction.transaction_id,
        risk_score=a.prediction.risk_score,
        status=a.status,
        priority=a.priority,
        origin_account_id=a.transaction.origin_account.account_id,
        dest_account_id=a.transaction.dest_account.account_id,
        amount=a.transaction.amount,
        timestamp=a.transaction.timestamp,
        notes=a.notes
    ) for a in alerts]


@router.get("/{alert_id}", response_model=AlertDetail)
async def get_alert(alert_id: int, db: Session = Depends(get_db)):
    """Get alert details."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return AlertDetail(
        alert_id=alert.id,
        transaction_id=alert.transaction.transaction_id,
        risk_score=alert.prediction.risk_score,
        status=alert.status,
        priority=alert.priority,
        origin_account_id=alert.transaction.origin_account.account_id,
        dest_account_id=alert.transaction.dest_account.account_id,
        amount=alert.transaction.amount,
        timestamp=alert.transaction.timestamp,
        notes=alert.notes
    )


@router.post("/{alert_id}/review")
async def review_alert(
    alert_id: int,
    request: AnalystReviewRequest,
    analyst_id: int,  # From JWT
    db: Session = Depends(get_db)
):
    """Submit analyst review of an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Create review record
    review = AnalystReview(
        alert_id=alert_id,
        analyst_id=analyst_id,
        is_fraud=request.is_fraud,
        confidence=request.confidence,
        notes=request.notes
    )
    
    db.add(review)
    
    # Update alert status
    alert.status = AlertStatus.REVIEWED if request.is_fraud else AlertStatus.FALSE_POSITIVE
    
    db.commit()
    
    logger.info(f"Alert {alert_id} reviewed by analyst {analyst_id}: fraud={request.is_fraud}")
    
    return {'alert_id': alert_id, 'status': alert.status}


@router.post("/{alert_id}/assign")
async def assign_alert(
    alert_id: int,
    analyst_id: int,
    db: Session = Depends(get_db)
):
    """Assign alert to an analyst."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.assigned_to = analyst_id
    alert.status = AlertStatus.ASSIGNED
    
    db.commit()
    
    return {'alert_id': alert_id, 'assigned_to': analyst_id}
