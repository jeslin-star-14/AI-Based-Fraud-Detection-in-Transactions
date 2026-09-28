# ai_agent — Fraud Investigation Agent

The reasoning layer on top of `ai_engine/`'s models. Given a natural-language
question, it decides which tools to call, calls them, and composes a
grounded answer — it never invents a risk score or reason that its tools
didn't actually produce.

## Structure
```
ai_agent/
├── agent_core.py              # orchestration: parse -> call tools -> compose
├── data_provider.py            # decouples the agent from any data source
├── sample_data.py               # fixture data for standalone demo/tests
├── tools/
│   ├── fraud_lookup_tool.py     # retrieves a transaction / account history
│   ├── risk_scoring_tool.py     # turns raw features into plain-language reasons
│   └── alert_tool.py             # turns a risk score into a recommended action
├── memory/
│   └── conversation_memory.py    # per-session history + "it"/"that transaction" resolution
├── prompts/
│   └── system_prompts.py          # templates for optional LLM-backed phrasing
├── llm_client.py                   # optional: Anthropic API call, off by default
└── demo.py                          # run this to try it standalone
```

## Why this counts as an *agent*, not just a lookup
Given a question, `agent_core.py` decides which tools it needs and in
what order, rather than following one fixed path:
1. **Parse** — extract a transaction ID, account ID, or resolve a
   back-reference ("what about **it**?") from conversation memory
2. **Retrieve** — call `fraud_lookup_tool` for the actual record
3. **Reason** — call `risk_scoring_tool` to turn raw features into
   plain-language explanations
4. **Decide** — call `alert_tool` to turn that into a recommended action
   (`auto_block` / `manual_review` / `monitor`)
5. **Respond** — compose the final answer, remembering what was discussed
   for follow-up questions in the same session

## Run it standalone (no backend needed)
```bash
cd ai_agent
python demo.py --scripted     # runs a fixed set of example questions
python demo.py                # interactive chat
```
Try asking about `TXN-88213`, `AC-4471`, or "summarize today's fraud
pattern" — see `sample_data.py` for all available sample records.

Example run:
```
> Why was TXN-88213 flagged?
TXN-88213 (AC-4471, $12,500.00 via Wire in Lagos, NG): Flagged with a risk
score of 91/100 because the amount is well above this account's typical
range; it came from a location not previously associated with this
account... Recommended action: auto_block (priority: high).

> What about its cluster?
TXN-88213 ... It also matches behavioral cluster 1, a group the model
associates with similar cases. ...
```
The second question has no transaction ID in it at all — the agent
resolves "its" back to TXN-88213 via `memory/conversation_memory.py`.

## Wiring it into the full project (with the real backend)
Swap `SampleDataProvider` for `BackendDataProvider` — nothing else in
`agent_core.py` changes:
```python
# backend/app/api/routes/agent.py
from agent_core import FraudAgent
from data_provider import BackendDataProvider

_agent = FraudAgent(data_provider=BackendDataProvider())

@router.post("/ask")
def ask_agent(query: AgentQuery):
    return {"answer": _agent.handle(query.question, session_id=query.context.get("session_id", "default"))}
```

## Optional: LLM-backed phrasing
The agent is fully rule-based by default — no API key required. To make
the final phrasing less templated:
```bash
export ANTHROPIC_API_KEY=your_key_here
pip install anthropic
```
`llm_client.py` then kicks in automatically. Critically, the LLM is only
ever handed facts the tools already retrieved (see `prompts/system_prompts.py`)
— it's asked to phrase them, never to invent a risk score or a reason on
its own. If no key is set, or the call fails for any reason, the agent
falls back to its template response — a demo never breaks because of a
missing/expired API key.

## Extending it
- More tools: drop a new file in `tools/`, import it in `agent_core.py`,
  and add a branch in `handle()` for when it should be called.
- Real feature attribution: swap `risk_scoring_tool.explain_risk`'s
  rule-based reasons for `shap.TreeExplainer` output on the Isolation
  Forest from `ai_engine/`.
- Persistent memory: replace `ConversationMemory`'s in-memory dict with
  a Redis or database-backed store if the agent needs to remember
  sessions across server restarts.
