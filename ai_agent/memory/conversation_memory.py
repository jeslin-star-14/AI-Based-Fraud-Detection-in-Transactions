"""
Minimal in-memory conversation state, per session. Two jobs:

1. Keep a transcript (useful if you later want to log conversations or
   feed history to an LLM for phrasing — see llm_client.py).
2. Track the last transaction/account mentioned, so a follow-up like
   "what about its cluster?" or "was that flagged before?" can be
   resolved without the user repeating the ID.

Swap this for a Redis-backed or DB-backed store if you need memory to
survive a server restart or work across multiple backend instances.
"""


class ConversationMemory:
    def __init__(self):
        self._sessions = {}

    def _session(self, session_id: str) -> dict:
        return self._sessions.setdefault(session_id, {
            "turns": [],
            "last_transaction_id": None,
            "last_account": None,
        })

    def add_turn(self, session_id: str, role: str, text: str):
        self._session(session_id)["turns"].append({"role": role, "text": text})

    def set_last_transaction(self, session_id: str, txn_id: str):
        self._session(session_id)["last_transaction_id"] = txn_id

    def set_last_account(self, session_id: str, account: str):
        self._session(session_id)["last_account"] = account

    def get_last_transaction(self, session_id: str):
        return self._session(session_id)["last_transaction_id"]

    def get_last_account(self, session_id: str):
        return self._session(session_id)["last_account"]

    def get_history(self, session_id: str):
        return self._session(session_id)["turns"]
