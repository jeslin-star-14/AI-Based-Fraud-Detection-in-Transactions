import os
import sys

# backend/, ai_engine/, and ai_agent/ are sibling folders under the project
# root. This makes both importable from anywhere inside the backend app.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
AI_ENGINE_DIR = os.path.join(PROJECT_ROOT, "ai_engine")
AI_AGENT_DIR = os.path.join(PROJECT_ROOT, "ai_agent")

for path in (PROJECT_ROOT, AI_ENGINE_DIR, AI_AGENT_DIR):
    if path not in sys.path:
        sys.path.append(path)

MODEL_DIR = os.path.join(AI_ENGINE_DIR, "models", "saved_models")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
