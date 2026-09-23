from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.api.routes import transactions, dashboard, agent

app = FastAPI(
    title="AI-Based Fraud Detection API",
    description="Backend for the fraud detection dashboard: transaction scoring, "
                 "dashboard analytics, and the AI fraud investigation agent.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(agent.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "service": "fraud-detection-backend"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
