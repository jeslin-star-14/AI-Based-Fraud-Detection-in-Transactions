from fastapi import APIRouter

from app.schemas.transaction_schema import AgentQuery, AgentResponse
from app import config  # ensures ai_agent/ is on sys.path before import below
from agent_core import FraudAgent

router = APIRouter(prefix="/agent", tags=["agent"])
_agent = FraudAgent()


@router.post("/ask", response_model=AgentResponse)
def ask_agent(query: AgentQuery):
    answer = _agent.handle(query.question, query.context)
    return {"answer": answer}
