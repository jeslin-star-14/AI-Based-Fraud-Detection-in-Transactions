"""
In-memory transaction store for the demo/academic build. Seeded once at
startup with synthetic transactions run through the real fraud model, so
risk scores and clusters come from ai_engine, not hardcoded values.

To move to a persistent database: replace this module's internals with
SQLAlchemy calls against the schema in database/schema.sql — the route
handlers in api/routes/transactions.py don't need to change, since they
only call the functions defined here.
"""

from datetime import datetime, timedelta
import random

from app.services.fraud_service import score_transaction, status_from_risk
from data_generator import generate_live_feed  # from ai_engine, path added in config.py

_transactions = []


def _seed(n=40):
    global _transactions
    df = generate_live_feed(n)
    now = datetime.now()
    rows = []
    for i, row in df.iterrows():
        features = {
            "amount": float(row["amount"]),
            "hour": int(row["hour"]),
            "distance_from_home": float(row["distance_from_home"]),
            "is_new_location": int(row["is_new_location"]),
            "velocity": int(row["velocity"]),
            "is_foreign": int(row["is_foreign"]),
        }
        risk, cluster = score_transaction(features)
        timestamp = now - timedelta(minutes=random.randint(0, 60 * 24 * 6))
        rows.append({
            "id": f"TXN-{88000 + i}",
            "account": row["account"],
            "amount": round(features["amount"], 2),
            "location": row["location"],
            "method": row["method"],
            "risk": risk,
            "status": status_from_risk(risk),
            "time": timestamp.strftime("%H:%M:%S"),
            "day": timestamp.strftime("%a"),
            "cluster": cluster,
            "_features": features,
        })
    _transactions = sorted(rows, key=lambda t: t["risk"], reverse=True)


def get_all(status: str = None):
    if not _transactions:
        _seed()
    if status and status != "all":
        return [t for t in _transactions if t["status"] == status]
    return _transactions


def get_by_id(txn_id: str):
    if not _transactions:
        _seed()
    return next((t for t in _transactions if t["id"] == txn_id), None)


def update_status(txn_id: str, status: str):
    txn = get_by_id(txn_id)
    if txn:
        txn["status"] = status
    return txn


def get_dashboard_stats():
    data = get_all()
    total = len(data)
    flagged = len([t for t in data if t["status"] == "flagged"])
    review = len([t for t in data if t["status"] == "review"])
    from app.services.fraud_service import get_metrics
    metrics = get_metrics()
    precision = f"{metrics['precision'] * 100:.1f}%" if metrics.get("precision") is not None else "n/a"

    return [
        {"label": "Transactions Today", "value": f"{total:,}", "trend": "+4.2%", "trendUp": True},
        {"label": "Flagged as Fraud", "value": str(flagged), "trend": "+18%", "trendUp": True, "tone": "risk"},
        {"label": "Under Review", "value": str(review), "trend": "-6%", "trendUp": False, "tone": "warn"},
        {"label": "Model Precision", "value": precision, "trend": "+0.8%", "trendUp": True, "tone": "safe"},
    ]


def get_risk_trend():
    data = get_all()
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    trend = []
    for day in days:
        day_txns = [t for t in data if t["day"] == day]
        trend.append({
            "day": day,
            "flagged": len([t for t in day_txns if t["status"] == "flagged"]),
            "cleared": len([t for t in day_txns if t["status"] == "cleared"]),
        })
    return trend
