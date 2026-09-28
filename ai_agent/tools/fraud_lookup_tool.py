"""
Tool the agent calls to retrieve a transaction's full record — including
the raw features that fed into its risk score. This is what lets the
agent explain *why* something was flagged, not just repeat the number.

Takes a `provider` (a DataProvider) so it never hardcodes where the data
comes from — see data_provider.py.
"""


def lookup_transaction(provider, txn_id: str) -> dict | None:
    return provider.get_transaction(txn_id)


def lookup_account_history(provider, account: str) -> list[dict]:
    return provider.get_account_history(account)
