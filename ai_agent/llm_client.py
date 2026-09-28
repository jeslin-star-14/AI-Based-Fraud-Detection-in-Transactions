"""
Optional. The agent works fully without this — agent_core.py's built-in
template composition is the default and requires no API key. Wire this
in if you want the final phrasing to sound less templated.

Set ANTHROPIC_API_KEY in the environment to enable it; if it's not set,
`is_available()` returns False and the agent silently uses templates
instead. The LLM is only ever given facts the tools already retrieved —
see prompts/system_prompts.py for what it is and isn't allowed to do.
"""

import os


class LLMClient:
    def __init__(self, model="claude-sonnet-4-6"):
        self.model = model
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")

    def is_available(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str) -> str | None:
        if not self.is_available():
            return None
        try:
            import anthropic
        except ImportError:
            return None

        try:
            client = anthropic.Anthropic(api_key=self.api_key)
            response = client.messages.create(
                model=self.model,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        except Exception as e:
            print(f"LLMClient: falling back to template ({e})")
            return None
