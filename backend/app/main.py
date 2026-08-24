from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth_router, chargebacks_router, audit_router

app = FastAPI(
    title="Chargeback Assistant API",
    description="AI-assisted chargeback risk scoring, explanation and recommendation engine.",
    version="1.0.0",
)

# Frontend URL
FRONTEND_URL = "http://localhost:5173"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router.router)
app.include_router(chargebacks_router.router)
app.include_router(audit_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}