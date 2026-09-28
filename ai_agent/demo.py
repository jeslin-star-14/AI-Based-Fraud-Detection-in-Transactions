"""
Standalone demo — run this to try the agent with no backend or frontend
required. Uses SampleDataProvider (sample_data.py) so it works out of
the box.

    python demo.py                    # interactive chat
    python demo.py --scripted         # runs a fixed set of example questions
"""

import sys
from agent_core import FraudAgent

SCRIPTED_QUESTIONS = [
    "Why was TXN-88213 flagged?",
    "What about its cluster?",          # back-reference resolution test
    "What's the history for AC-4471?",
    "Summarize today's fraud pattern",
]


def run_scripted():
    agent = FraudAgent()
    session = "demo"
    for q in SCRIPTED_QUESTIONS:
        print(f"\n> {q}")
        print(agent.handle(q, session_id=session))


def run_interactive():
    agent = FraudAgent()
    session = "cli"
    print("Fraud Agent (standalone demo). Try IDs from sample_data.py, e.g. TXN-88213.")
    print("Type 'quit' to exit.\n")
    while True:
        try:
            q = input("> ")
        except (EOFError, KeyboardInterrupt):
            break
        if q.strip().lower() in {"quit", "exit"}:
            break
        print(agent.handle(q, session_id=session))


if __name__ == "__main__":
    if "--scripted" in sys.argv:
        run_scripted()
    else:
        run_interactive()
