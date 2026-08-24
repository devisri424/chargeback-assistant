# Chargeback Assistant

An AI-assisted chargeback (dispute) risk scoring and recommendation tool. For
each incoming chargeback, it predicts the probability the merchant would win
representment, explains *why* using SHAP, runs an investigation trace through
a LangGraph agent, and recommends an action (fight, accept liability, or
gather more evidence).

Built on the stack: **React + Tailwind (frontend) · FastAPI (backend) ·
XGBoost + scikit-learn (ML) · SHAP (explainability) · LangGraph (agent) ·
PostgreSQL (storage) · JWT (auth) · Recharts (charts) · Docker (packaging)**.

## How it's different from a generic fraud score

Instead of a generic "Low / Medium / High fraud risk" label, this predicts
**win probability of the dispute** (`won_dispute`) from chargeback-specific
signals — reason code, delivery/signature evidence, AVS/CVV match, refund
status, prior chargeback history — and turns that into a concrete
recommendation: fight it, accept the loss, or collect more evidence first.

## Project layout

```
chargeback-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py                 FastAPI app + routing
│   │   ├── config.py                Settings (env vars)
│   │   ├── database.py              SQLAlchemy engine/session
│   │   ├── models.py                ORM models (User, Chargeback, Prediction, AuditLog)
│   │   ├── schemas.py               Pydantic request/response models
│   │   ├── auth.py                  JWT auth helpers
│   │   ├── routers/
│   │   │   ├── auth_router.py       /auth/register, /auth/login
│   │   │   ├── chargebacks_router.py /chargebacks/predict, list, detail, status
│   │   │   └── audit_router.py      /audit, /analytics/summary
│   │   ├── ml/
│   │   │   ├── generate_dataset.py  synthetic chargeback dataset generator
│   │   │   ├── train_model.py       trains + evaluates the XGBoost model
│   │   │   └── predict.py           inference + SHAP explanations
│   │   └── agent/
│   │       └── chargeback_agent.py  LangGraph reasoning agent
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                   Dashboard, Chargebacks, ChargebackDetail,
│   │   │                            NewChargeback, Analytics, AuditLogs, Login
│   │   ├── components/              Sidebar, RiskBadge, StatCard
│   │   ├── context/AuthContext.jsx  JWT auth state
│   │   └── api/client.js            axios client with auth interceptor
│   ├── package.json
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

## Run it with Docker (recommended)

```bash
docker compose up --build
```

This starts Postgres, trains the model at backend build time, and serves:

- Frontend: http://localhost:5173
- Backend API + interactive docs: http://localhost:8000/docs

Register an account from the login screen, then use **Score a case** to
submit your first chargeback.

## Run it locally without Docker

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# point at a local/dockerized Postgres, or use SQLite for a quick try:
export DATABASE_URL="sqlite:///./dev.db"
export JWT_SECRET_KEY="dev-secret"

# generate synthetic data and train the model
python -m app.ml.generate_dataset
python -m app.ml.train_model

uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000` by default (override
with a `VITE_API_BASE_URL` env var).

## Retraining the model

The dataset and model are synthetic/illustrative. To use your own historical
chargeback data:

1. Replace `backend/data/chargebacks.csv` with your data, keeping the same
   columns (see `app/ml/train_model.py` for the expected schema), with a
   `won_dispute` column (1 = merchant won, 0 = merchant lost).
2. Re-run `python -m app.ml.train_model` — this overwrites
   `app/ml/artifacts/model.pkl` and `preprocessor.pkl`.
3. Restart the backend (or rebuild the Docker image) to pick up the new
   artifacts.

`train_model.py` prints precision, recall, F1, the confusion matrix, and
false positive rate on a held-out test split every time it runs.

## API reference

| Method | Path                          | Description                                  |
|--------|-------------------------------|-----------------------------------------------|
| POST   | `/auth/register`              | Create an account                             |
| POST   | `/auth/login`                 | Get a JWT (OAuth2 password flow)              |
| POST   | `/chargebacks/predict`        | Score a chargeback, store it + its prediction |
| GET    | `/chargebacks`                | List chargebacks (filter by `status_filter`)  |
| GET    | `/chargebacks/{id}`           | Case detail + latest prediction               |
| PATCH  | `/chargebacks/{id}/status`    | Update case status (open/won/lost/accepted)   |
| GET    | `/audit`                      | Audit log of predictions and status changes   |
| GET    | `/analytics/summary`          | Portfolio-level risk/reason/status breakdown  |

Full interactive docs are available at `/docs` once the backend is running.

## Notes on the LangGraph agent

`app/agent/chargeback_agent.py` builds a small `StateGraph` with three nodes
— `analyze_risk → explain_factors → recommend` — that turns the raw model
output and SHAP factors into a structured investigation trace. It runs fully
deterministically out of the box (no LLM key required), so the whole project
works offline. If you want free-text analyst notes instead of the templated
trace, swap the `recommend` node to call an LLM (Anthropic key is already
wired into `config.py` via `ANTHROPIC_API_KEY`) using the trace as context.

## Security notes before production use

- Set a strong, random `JWT_SECRET_KEY` and restrict CORS
  (`allow_origins=["*"]` in `main.py` is fine for local dev only).
- Add rate limiting on `/auth/login` and `/chargebacks/predict`.
- Consider row-level authorization if multiple merchants share one deployment
  (the current schema is single-tenant).
- The synthetic dataset and model are for demonstration — validate against
  real historical outcomes before using this to drive live dispute decisions.
"# chargeback-assistant" 
