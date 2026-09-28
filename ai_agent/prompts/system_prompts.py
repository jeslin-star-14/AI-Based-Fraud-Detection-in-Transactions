"""
Templates used only if an LLM client is configured (see llm_client.py).
The agent's tool-calling and reasoning happen in agent_core.py regardless
of whether an LLM is wired in — these prompts only affect how the final
answer is *phrased*, never what facts it's based on. The LLM is given
the already-retrieved, already-computed facts and asked to phrase them;
it is never asked to invent risk scores or reasons on its own.
"""

EXPLAIN_TRANSACTION_PROMPT = """You are a fraud analyst assistant. Explain the following flagged \
transaction to a human reviewer in 2-3 clear sentences. Use only the facts given below — do not \
invent any additional numbers or reasons.

Transaction: {txn_id}
Account: {account}
Amount: ${amount:,.2f}
Risk score: {risk}/100
Reasons the model flagged it: {reasons}
Recommended action: {action}
"""

SUMMARIZE_PATTERN_PROMPT = """You are a fraud analyst assistant. Summarize the current fraud \
pattern for a human reviewer in 2-3 sentences, using only the facts below.

Number of flagged transactions: {count}
Most common behavioral cluster among them: {top_cluster}
Most common payment method among them: {top_method}
"""
