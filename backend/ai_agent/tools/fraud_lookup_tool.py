"""
Tool the agent calls to retrieve a transaction's full record, including
the raw features that fed into its risk score. This is what lets the
agent explain *why* something was flagged instead of just repeating the
number.
"""

import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))


def lookup_transaction(txn_id: str):
    from app.services.transaction_service import get_by_id
    return get_by_id(txn_id)


def lookup_account_history(account: str):
    from app.services.transaction_service import get_all
    return [t for t in get_all() if t["account"] == account]
