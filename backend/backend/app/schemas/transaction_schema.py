from pydantic import BaseModel
from typing import Optional, Literal


class Transaction(BaseModel):
    id: str
    account: str
    amount: float
    location: str
    method: str
    risk: int
    status: Literal["flagged", "review", "cleared"]
    time: str
    cluster: Optional[int] = None


class TransactionStatusUpdate(BaseModel):
    status: Literal["flagged", "review", "cleared"]


class AgentQuery(BaseModel):
    question: str
    context: Optional[dict] = None


class AgentResponse(BaseModel):
    answer: str
