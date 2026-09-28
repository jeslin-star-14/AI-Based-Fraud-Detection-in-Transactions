"""
Tool the agent calls to turn a risk score into a concrete recommended
action — this is the "so what do I actually do" step that separates an
agent from a classifier. In production, `raise_alert()` is where you'd
call out to a real notification service (email/Slack/SMS) or write to
the fraud_alerts table in database/schema.sql; here it just returns a
structured alert record the caller can act on.
"""

from datetime import datetime, timezone

ACTION_THRESHOLDS = [
    (85, "auto_block", "high"),
    (60, "manual_review", "medium"),
    (0, "monitor", "low"),
]


def recommend_action(risk: int) -> dict:
    for threshold, action, priority in ACTION_THRESHOLDS:
        if risk >= threshold:
            return {"action": action, "priority": priority}
    return {"action": "monitor", "priority": "low"}


def raise_alert(txn: dict, explanation: dict) -> dict:
    """Builds a structured alert. Returns the record rather than sending
    it anywhere — wire this up to a notifier or database write in your
    deployment."""
    recommendation = recommend_action(txn["risk"])
    return {
        "alert_id": f"ALERT-{txn['id']}",
        "transaction_id": txn["id"],
        "account": txn["account"],
        "risk": txn["risk"],
        "action": recommendation["action"],
        "priority": recommendation["priority"],
        "reason_summary": explanation["summary"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
