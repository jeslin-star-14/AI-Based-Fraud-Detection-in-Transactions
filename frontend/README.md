# Sentinel — Fraud Detection Frontend

React frontend for the AI-Based Fraud Detection in Transactions system.

## Setup
```bash
cd frontend
npm install
npm start
```
Runs at http://localhost:3000. Set `REACT_APP_API_BASE_URL` in `.env` to point at your Python backend (default `http://localhost:8000/api`).

## What's here
- **Dashboard** — KPI cards, flagged-vs-cleared trend chart, recent transactions
- **Transactions** — full table with status filters
- **Fraud Alerts** — high-risk transactions needing action
- **Agent widget** (bottom-right, every page) — chat interface into `ai_agent/`, for asking "why was this flagged" or getting a risk summary in plain language

## Connecting the backend
Every network call lives in `src/services/`. Right now they fall back to
`src/data/mockData.js` if the backend isn't running, so the UI is demoable
standalone. Once `backend/app/api/routes/transactions.py` and `agent.py`
are live, the app switches to real data automatically — no component changes
needed.

Expected endpoints:
- `GET /api/dashboard/stats`
- `GET /api/dashboard/risk-trend`
- `GET /api/transactions`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `POST /api/agent/ask` — body `{ question, context }`, returns `{ answer }`
