"""
FraudAgent — the orchestration layer that turns a natural-language
question into a plan (which tools to call, in what order) and a grounded
answer. This is what makes the system an *agent* rather than a plain ML
pipeline: it decides which tools it needs based on the question, calls
them, and composes the result.

Flow for a question like "Why was TXN-88213 flagged?":
  1. Parse the transaction ID out of the question
  2. Call fraud_lookup_tool -> get the transaction + its raw features
  3. Call risk_scoring_tool  -> turn features into plain-language reasons
  4. Compose a final natural-language answer

Extension point: to use a real LLM (Anthropic/OpenAI) to phrase the final
answer instead of the template in `_compose`, call your provider's chat
API with the grounded facts gathered in steps 1-3 as context. Keep the
tool-calling logic above unchanged — only swap `_compose`.
"""

import re

from tools.fraud_lookup_tool import lookup_transaction, lookup_account_history
from tools.risk_scoring_tool import explain_risk

TXN_ID_PATTERN = re.compile(r"TXN-\d+", re.IGNORECASE)
ACCOUNT_PATTERN = re.compile(r"AC-\d+", re.IGNORECASE)


class FraudAgent:
    def handle(self, question: str, context: dict = None) -> str:
        context = context or {}
        txn_match = TXN_ID_PATTERN.search(question) or TXN_ID_PATTERN.search(str(context.get("transaction_id", "")))
        account_match = ACCOUNT_PATTERN.search(question)

        if txn_match:
            return self._explain_transaction(txn_match.group(0).upper())

        if account_match:
            return self._summarize_account(account_match.group(0).upper())

        if any(k in question.lower() for k in ["pattern", "summary", "summarize", "trend"]):
            return self._summarize_patterns()

        return (
            "I can explain why a specific transaction was flagged (ask about a TXN- id), "
            "summarize an account's history (ask about an AC- id), or summarize today's "
            "overall fraud pattern. What would you like to look into?"
        )

    def _explain_transaction(self, txn_id: str) -> str:
        txn = lookup_transaction(txn_id)
        if not txn:
            return f"I couldn't find a transaction with ID {txn_id}."

        explanation = explain_risk(txn["_features"], txn["risk"], txn.get("cluster"))
        return (
            f"{txn_id} ({txn['account']}, ${txn['amount']:,.2f} via {txn['method']} in {txn['location']}): "
            f"{explanation['summary']}"
        )

    def _summarize_account(self, account: str) -> str:
        history = lookup_account_history(account)
        if not history:
            return f"I don't have any transactions on record for {account}."

        flagged = [t for t in history if t["status"] == "flagged"]
        avg_risk = sum(t["risk"] for t in history) / len(history)

        if not flagged:
            return f"{account} has {len(history)} recent transactions with an average risk score of {avg_risk:.0f}/100, and none currently flagged."

        worst = max(flagged, key=lambda t: t["risk"])
        return (
            f"{account} has {len(history)} recent transactions, {len(flagged)} flagged. "
            f"Average risk score is {avg_risk:.0f}/100. The highest-risk one is {worst['id']} "
            f"at {worst['risk']}/100 — worth reviewing first."
        )

    def _summarize_patterns(self) -> str:
        from tools.fraud_lookup_tool import lookup_account_history  # noqa: F401 (kept for parity with other tools)
        import sys, os
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
        from app.services.transaction_service import get_all

        data = get_all()
        flagged = [t for t in data if t["status"] == "flagged"]
        if not flagged:
            return "No transactions are currently flagged — fraud activity looks quiet."

        clusters = {}
        for t in flagged:
            clusters[t.get("cluster")] = clusters.get(t.get("cluster"), 0) + 1
        top_cluster = max(clusters, key=clusters.get)

        methods = {}
        for t in flagged:
            methods[t["method"]] = methods.get(t["method"], 0) + 1
        top_method = max(methods, key=methods.get)

        return (
            f"There are {len(flagged)} flagged transactions right now. Most cluster around "
            f"behavioral group {top_cluster}, and {top_method} is the most common method involved. "
            f"Recommend reviewing the highest-risk accounts in that group first."
        )
