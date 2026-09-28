from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class AgentRequest(BaseModel):
    messages: List[Message]
    transaction_id: int = None

class AgentResponse(BaseModel):
    response: str
    confidence: float
    action: str = None

@router.post("/chat")
async def agent_chat(request: AgentRequest):
    """
    Chat with the AI fraud detection agent
    """
    user_message = request.messages[-1].content if request.messages else ""
    
    # Mock AI response
    response_map = {
        "fraud": {
            "response": "This transaction has a 85% probability of being fraudulent based on multiple factors.",
            "confidence": 0.85,
            "action": "block"
        },
        "transaction": {
            "response": "The transaction appears to be legitimate. All risk indicators are within normal ranges.",
            "confidence": 0.92,
            "action": "approve"
        }
    }
    
    # Simple routing based on keywords
    if any(word in user_message.lower() for word in ["fraud", "suspicious", "alert"]):
        return response_map["fraud"]
    
    return response_map["transaction"]

@router.post("/analyze")
async def analyze_transaction(transaction_id: int):
    """
    Analyze a specific transaction for fraud
    """
    return {
        "transaction_id": transaction_id,
        "risk_score": 0.35,
        "risk_level": "low",
        "factors": [
            {"factor": "Location Risk", "score": 0.2},
            {"factor": "Amount Risk", "score": 0.15},
            {"factor": "Time Risk", "score": 0.0}
        ],
        "recommendation": "approve"
    }

@router.get("/insights")
async def get_insights():
    """
    Get fraud detection insights and patterns
    """
    return {
        "total_transactions": 10000,
        "fraudulent_transactions": 245,
        "fraud_rate": 2.45,
        "top_risk_factors": [
            "Unusual Location",
            "Timing Pattern",
            "Amount Anomaly"
        ],
        "recent_patterns": [
            "Increase in card-not-present fraud",
            "Account takeover attempts from multiple IPs"
        ]
    }
