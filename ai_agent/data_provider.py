"""
The agent never talks to a database or the backend directly — it talks
to a DataProvider. This is what makes it testable and runnable on its
own (see sample_data.py), and swappable in production without touching
agent logic at all.

Two implementations:
- SampleDataProvider : in-memory synthetic data, used for standalone
  demos and unit tests. No backend required.
- BackendDataProvider: thin adapter that calls into the real backend's
  transaction_service when the agent is deployed alongside it.
"""

from abc import ABC, abstractmethod


class DataProvider(ABC):
    @abstractmethod
    def get_transaction(self, txn_id: str) -> dict | None:
        ...

    @abstractmethod
    def get_account_history(self, account: str) -> list[dict]:
        ...

    @abstractmethod
    def get_flagged_transactions(self) -> list[dict]:
        ...


class SampleDataProvider(DataProvider):
    """Standalone demo data — lets the agent run and be tested with no
    other part of the project running."""

    def __init__(self):
        from sample_data import SAMPLE_TRANSACTIONS
        self._data = SAMPLE_TRANSACTIONS

    def get_transaction(self, txn_id):
        return next((t for t in self._data if t["id"] == txn_id.upper()), None)

    def get_account_history(self, account):
        return [t for t in self._data if t["account"] == account.upper()]

    def get_flagged_transactions(self):
        return [t for t in self._data if t["status"] == "flagged"]


class BackendDataProvider(DataProvider):
    """Adapter used when this module is deployed inside the full project,
    sitting next to backend/. Imports are done lazily inside each method
    so this class can exist (and even be imported) without the backend
    being importable — it only breaks if you actually call it without
    the backend present, which is the correct failure point.

    Usage from the backend (e.g. api/routes/agent.py):
        from agent_core import FraudAgent
        from data_provider import BackendDataProvider
        agent = FraudAgent(data_provider=BackendDataProvider())
    """

    def get_transaction(self, txn_id):
        from app.services.transaction_service import get_by_id
        return get_by_id(txn_id)

    def get_account_history(self, account):
        from app.services.transaction_service import get_all
        return [t for t in get_all() if t["account"] == account]

    def get_flagged_transactions(self):
        from app.services.transaction_service import get_all
        return [t for t in get_all() if t["status"] == "flagged"]
