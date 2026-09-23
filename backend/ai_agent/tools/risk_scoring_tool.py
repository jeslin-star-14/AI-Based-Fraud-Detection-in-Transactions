"""
Tool the agent calls to turn a transaction's raw feature values into
plain-language reasons. This is a lightweight stand-in for a proper
SHAP/feature-attribution explainer — swap in `shap.TreeExplainer` on the
Isolation Forest here if you want real attribution values for the report.
"""

NORMAL_RANGES = {
    "amount": 350,             # typical legitimate transaction
    "distance_from_home": 20,  # km
    "velocity": 2,             # transactions/hour
}


def explain_risk(features: dict, risk: int, cluster: int = None):
    reasons = []

    if features["amount"] > NORMAL_RANGES["amount"] * 3:
        reasons.append(
            f"the amount (${features['amount']:,.2f}) is well above this account's typical range"
        )
    if features.get("is_new_location"):
        reasons.append("it came from a location not previously associated with this account")
    if features.get("is_foreign"):
        reasons.append("it's a cross-border transaction")
    if features["velocity"] > NORMAL_RANGES["velocity"] * 2:
        reasons.append(f"there were {features['velocity']} transactions from this account in the last hour, well above normal")
    if features.get("distance_from_home", 0) > NORMAL_RANGES["distance_from_home"] * 5:
        reasons.append("the transaction location is far from the account's usual activity area")
    if features.get("hour", 12) < 5 or features.get("hour", 12) > 23:
        reasons.append("it occurred at an unusual hour")

    if not reasons:
        reasons.append("no single factor stands out, but the combined pattern is atypical for this account")

    cluster_note = f" It also matches behavioral cluster {cluster}, a group the model associates with similar cases." if cluster is not None else ""

    return {
        "risk": risk,
        "reasons": reasons,
        "summary": f"Flagged with a risk score of {risk}/100 because " + "; ".join(reasons) + "." + cluster_note,
    }
