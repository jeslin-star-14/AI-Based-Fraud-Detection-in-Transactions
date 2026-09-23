from fastapi import APIRouter

from app.services import transaction_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats():
    return transaction_service.get_dashboard_stats()


@router.get("/risk-trend")
def risk_trend():
    return transaction_service.get_risk_trend()
