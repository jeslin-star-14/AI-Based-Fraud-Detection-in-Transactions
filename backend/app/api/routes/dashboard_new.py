"""
Dashboard analytics endpoints.

All metrics computed from real database data.
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database.db import get_db
from backend.app.database.models import (
    Transaction, Prediction, Alert, AnalystReview, AlertStatus
)
from backend.app.schemas import DashboardMetrics

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get dashboard summary metrics for the last N hours."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    # Total transactions in time window
    total_tx = db.query(func.count(Transaction.id)).filter(
        Transaction.created_at >= cutoff
    ).scalar() or 0
    
    # Flagged transactions
    flagged_count = db.query(func.count(Prediction.id)).filter(
        Prediction.created_at >= cutoff,
        Prediction.flagged == True
    ).scalar() or 0
    
    # Blocked transactions
    blocked_count = db.query(func.count(Prediction.id)).filter(
        Prediction.created_at >= cutoff,
        Prediction.blocked == True
    ).scalar() or 0
    
    # Confirmed fraud (analyst reviews)
    fraud_reviews = db.query(func.count(AnalystReview.id)).filter(
        AnalystReview.created_at >= cutoff,
        AnalystReview.is_fraud == True
    ).scalar() or 0
    
    # False positives
    false_positive_count = db.query(func.count(AnalystReview.id)).filter(
        AnalystReview.created_at >= cutoff,
        AnalystReview.is_fraud == False
    ).scalar() or 0
    
    # Get active model version
    latest_prediction = db.query(Prediction).filter(
        Prediction.created_at >= cutoff
    ).order_by(Prediction.created_at.desc()).first()
    
    model_version = latest_prediction.model_version if latest_prediction else "unknown"
    
    # Compute precision from analyst feedback
    total_reviews = fraud_reviews + false_positive_count
    accuracy = (fraud_reviews / total_reviews) if total_reviews > 0 else None
    
    return DashboardMetrics(
        total_transactions=total_tx,
        flagged_count=flagged_count,
        blocked_count=blocked_count,
        fraud_confirmed_count=fraud_reviews,
        false_positive_count=false_positive_count,
        model_version=model_version,
        accuracy_from_feedback=accuracy
    )


@router.get("/alerts/timeline")
async def get_alerts_timeline(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get alert counts by hour."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    # Group alerts by hour
    from sqlalchemy import extract
    
    timeline = db.query(
        extract('hour', Alert.created_at).label('hour'),
        func.count(Alert.id).label('count')
    ).filter(
        Alert.created_at >= cutoff
    ).group_by(
        extract('hour', Alert.created_at)
    ).order_by('hour').all()
    
    return {
        'timeline': [{'hour': int(h), 'count': int(c)} for h, c in timeline]
    }


@router.get("/transactions/by-type")
async def get_transactions_by_type(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get transaction counts by type."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    results = db.query(
        Transaction.transaction_type,
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.amount).label('total_amount')
    ).filter(
        Transaction.created_at >= cutoff
    ).group_by(
        Transaction.transaction_type
    ).all()
    
    return {
        'by_type': [
            {
                'type': str(tx_type),
                'count': int(count),
                'total_amount': float(total_amount) if total_amount else 0
            }
            for tx_type, count, total_amount in results
        ]
    }


@router.get("/risk-distribution")
async def get_risk_distribution(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get distribution of risk scores."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    predictions = db.query(Prediction.risk_score).filter(
        Prediction.created_at >= cutoff
    ).all()
    
    if not predictions:
        return {'buckets': []}
    
    # Bucket risk scores into bins
    scores = [p[0] for p in predictions]
    import numpy as np
    hist, bin_edges = np.histogram(scores, bins=10, range=(0, 1))
    
    buckets = []
    for i in range(len(hist)):
        buckets.append({
            'min': float(bin_edges[i]),
            'max': float(bin_edges[i + 1]),
            'count': int(hist[i])
        })
    
    return {'buckets': buckets}
