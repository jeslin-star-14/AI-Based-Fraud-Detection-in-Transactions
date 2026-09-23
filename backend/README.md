# AI-Based Fraud Detection — Backend + AI Engine + AI Agent

Three parts, meant to sit as siblings of the `frontend/` folder from before:

```
ai-fraud-detection-system/
├── frontend/        (React — from earlier)
├── backend/         (FastAPI — serves the REST API)
├── ai_engine/        (trains the Isolation Forest + KMeans models)
├── ai_agent/          (the fraud investigation agent)
└── database/         (reference SQL schema for later)
```

## 1. Requirements
- Python 3.10+
- Node.js 18+ (for the frontend, already delivered)

## 2. Set up a virtual environment
```bash
cd ai-fraud-detection-system
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

## 3. Train the models (run once)
This generates synthetic transaction data, trains the Isolation Forest
(anomaly detection) and KMeans (clustering) models, and saves them to
`ai_engine/models/saved_models/`.
```bash
cd ai_engine
python train_pipeline.py
cd ..
```
You'll see precision/recall/F1 printed — put these straight into your report.
If you skip this step, the backend still runs using a simpler rule-based
score as a fallback, so nothing breaks during a live demo.

## 4. Run the backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
- API root: http://localhost:8000
- Interactive docs (Swagger UI): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

On first request, the backend seeds itself with ~40 synthetic transactions
scored by the trained model — no database setup needed to try it out.

## 5. Run the frontend
In a separate terminal:
```bash
cd frontend
npm install
npm start
```
Opens at http://localhost:3000 and talks to the backend at
`http://localhost:8000/api` (set in `frontend/.env`).

## 6. Try it end-to-end
1. Open http://localhost:3000 — dashboard stats and the risk trend chart
   are now coming from the real Isolation Forest scores.
2. Go to **Fraud Alerts** to see the highest-risk transactions.
3. Click **Ask the fraud agent** (bottom-right) and try:
   - "Why was TXN-88005 flagged?" (use any ID shown in the Transactions page)
   - "Summarize today's fraud pattern"
   - "What's the history for AC-1234?" (use an account from the table)

## API reference
| Method | Endpoint                        | Purpose                          |
|--------|----------------------------------|-----------------------------------|
| GET    | `/api/dashboard/stats`          | KPI cards                        |
| GET    | `/api/dashboard/risk-trend`     | 7-day flagged/cleared chart data |
| GET    | `/api/transactions`             | List all (optional `?status=`)   |
| GET    | `/api/transactions/{id}`        | Single transaction detail        |
| PATCH  | `/api/transactions/{id}`        | Update status (body: `{"status": "cleared"}`) |
| POST   | `/api/agent/ask`                | Ask the fraud agent a question   |

## Notes for your report
- **Anomaly detection**: Isolation Forest (`ai_engine/train_pipeline.py`), scored on 6 engineered features (amount, hour, distance from home, new-location flag, transaction velocity, foreign-transaction flag).
- **Clustering**: KMeans (k=5) groups transactions into behavioral clusters so the agent can reference "this matches a pattern seen before" rather than treating every transaction in isolation.
- **AI agent**: `ai_agent/agent_core.py` — parses the question, decides which tool to call (`fraud_lookup_tool`, `risk_scoring_tool`), and composes a grounded answer. It's rule-based by default (no API key needed to run/demo); the docstring in `agent_core.py` shows exactly where to plug in a real LLM call if you want the phrasing to be less templated.
- **Storage**: in-memory for this build, so it runs with zero setup. `database/schema.sql` shows the schema to move to Postgres/MySQL if your course requires persistent storage.
