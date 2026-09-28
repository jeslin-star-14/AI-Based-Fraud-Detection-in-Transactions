"""
FraudAgent — decides which tools a question needs, calls them in order,
and composes a grounded answer. This is what makes it an *agent* rather
than a plain lookup: it plans a sequence of tool calls based on the
question, rather than following one fixed code path.

Flow for "Why was TXN-88213 flagged?":
  1. Parse the transaction ID out of the question (or resolve "it" /
     "that transaction" from memory)
  2. fraud_lookup_tool.lookup_transaction  -> the record + raw features
  3. risk_scoring_tool.explain_risk        -> plain-language reasons
  4. alert_tool.recommend_action           -> what to actually do about it
  5. Compose the final answer — via LLM if configured, else a template
  6. Remember this transaction for follow-up questions in the same session
"""

import re

from tools.fraud_lookup_tool import lookup_transaction, lookup_account_history
from tools.risk_scoring_tool import explain_risk
from tools.alert_tool import recommend_action
from memory.conversation_memory import ConversationMemory
from data_provider import DataProvider, SampleDataProvider
from prompts.system_prompts import EXPLAIN_TRANSACTION_PROMPT, SUMMARIZE_PATTERN_PROMPT

TXN_ID_PATTERN = re.compile(r"TXN-\d+", re.IGNORECASE)
ACCOUNT_PATTERN = re.compile(r"AC-\d+", re.IGNORECASE)
BACK_REFERENCE = re.compile(r"\b(it|its|that transaction|this transaction)\b", re.IGNORECASE)


class FraudAgent:
    def __init__(self, data_provider: DataProvider = None, llm_client=None, memory: ConversationMemory = None):
        self.provider = data_provider or SampleDataProvider()
        self.llm = llm_client
        self.memory = memory or ConversationMemory()

    def handle(self, question: str, session_id: str = "default", context: dict = None) -> str:
        context = context or {}
        self.memory.add_turn(session_id, "user", question)

        txn_id = self._resolve_transaction_id(question, session_id, context)
        account = self._extract(ACCOUNT_PATTERN, question)

        if txn_id:
            answer = self._explain_transaction(txn_id, session_id)
        elif account:
            answer = self._summarize_account(account)
        elif any(k in question.lower() for k in ["pattern", "summary", "summarize", "trend"]):
            answer = self._summarize_patterns()
        else:
            answer = (
                "I can explain why a specific transaction was flagged (ask about a TXN- id), "
                "summarize an account's history (ask about an AC- id), or summarize today's "
                "overall fraud pattern. What would you like to look into?"
            )

        self.memory.add_turn(session_id, "agent", answer)
        return answer

    # --- reference resolution -------------------------------------------------

    def _resolve_transaction_id(self, question: str, session_id: str, context: dict) -> str | None:
        direct = self._extract(TXN_ID_PATTERN, question)
        if direct:
            return direct
        if context.get("transaction_id"):
            return context["transaction_id"].upper()
        if BACK_REFERENCE.search(question):
            return self.memory.get_last_transaction(session_id)
        return None

    @staticmethod
    def _extract(pattern, text):
        match = pattern.search(text)
        return match.group(0).upper() if match else None

    # --- tool orchestration ----------------------------------------------------

    def _explain_transaction(self, txn_id: str, session_id: str) -> str:
        txn = lookup_transaction(self.provider, txn_id)
        if not txn:
            return f"I couldn't find a transaction with ID {txn_id}."

        self.memory.set_last_transaction(session_id, txn_id)
        self.memory.set_last_account(session_id, txn["account"])

        explanation = explain_risk(txn["_features"], txn["risk"], txn.get("cluster"))
        recommendation = recommend_action(txn["risk"])

        if self.llm and self.llm.is_available():
            prompt = EXPLAIN_TRANSACTION_PROMPT.format(
                txn_id=txn_id, account=txn["account"], amount=txn["amount"],
                risk=txn["risk"], reasons="; ".join(explanation["reasons"]),
                action=recommendation["action"],
            )
            llm_answer = self.llm.generate(prompt)
            if llm_answer:
                return llm_answer

        return (
            f"{txn_id} ({txn['account']}, ${txn['amount']:,.2f} via {txn['method']} in {txn['location']}): "
            f"{explanation['summary']} Recommended action: {recommendation['action']} "
            f"(priority: {recommendation['priority']})."
        )

    def _summarize_account(self, account: str) -> str:
        history = lookup_account_history(self.provider, account)
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
        flagged = self.provider.get_flagged_transactions()
        if not flagged:
            return "No transactions are currently flagged — fraud activity looks quiet."

        clusters = {}
        methods = {}
        for t in flagged:
            clusters[t.get("cluster")] = clusters.get(t.get("cluster"), 0) + 1
            methods[t["method"]] = methods.get(t["method"], 0) + 1
        top_cluster = max(clusters, key=clusters.get)
        top_method = max(methods, key=methods.get)

        if self.llm and self.llm.is_available():
            prompt = SUMMARIZE_PATTERN_PROMPT.format(
                count=len(flagged), top_cluster=top_cluster, top_method=top_method
            )
            llm_answer = self.llm.generate(prompt)
            if llm_answer:
                return llm_answer

        return (
            f"There are {len(flagged)} flagged transactions right now. Most cluster around "
            f"behavioral group {top_cluster}, and {top_method} is the most common method involved. "
            f"Recommend reviewing the highest-risk accounts in that group first."
        )
