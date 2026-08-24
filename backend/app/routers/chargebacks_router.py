import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.ml.predict import predict_chargeback
from app.agent.chargeback_agent import run_agent

router = APIRouter(prefix="/chargebacks", tags=["chargebacks"])


def _log_audit(db: Session, user: models.User, action: str, details: str):
    entry = models.AuditLog(user_id=user.id if user else None, action=action, details=details)
    db.add(entry)
    db.commit()


@router.post("/predict", response_model=schemas.PredictionResult)
def predict(
    payload: schemas.ChargebackInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # 1. persist the chargeback case
    cb = models.Chargeback(**payload.model_dump())
    db.add(cb)
    db.commit()
    db.refresh(cb)

    # 2. run ML prediction + SHAP explanation
    ml_result = predict_chargeback(payload.model_dump())

    # 3. run the reasoning agent to build an investigation trace
    agent_result = run_agent(
        chargeback=payload.model_dump(),
        win_probability=ml_result["win_probability"],
        risk_level=ml_result["risk_level"],
        top_factors=ml_result["top_factors"],
        recommendation=ml_result["recommendation"],
    )

    # 4. persist the prediction
    prediction = models.Prediction(
        chargeback_id=cb.id,
        risk_level=ml_result["risk_level"],
        win_probability=ml_result["win_probability"],
        recommendation=ml_result["recommendation"],
        top_factors=json.dumps(ml_result["top_factors"]),
        agent_reasoning=json.dumps(agent_result),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    _log_audit(
        db,
        current_user,
        action="predict",
        details=f"Scored chargeback {cb.transaction_id}: {ml_result['risk_level']} risk, "
        f"win_probability={ml_result['win_probability']}",
    )

    return schemas.PredictionResult(
        chargeback_id=cb.id,
        risk_level=ml_result["risk_level"],
        win_probability=ml_result["win_probability"],
        recommendation=ml_result["recommendation"],
        top_factors=ml_result["top_factors"],
        agent_reasoning=agent_result,
    )


@router.get("", response_model=List[schemas.ChargebackOut])
def list_chargebacks(
    status_filter: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Chargeback).order_by(desc(models.Chargeback.created_at))
    if status_filter:
        q = q.filter(models.Chargeback.status == status_filter)
    return q.limit(limit).all()


@router.get("/{chargeback_id}")
def get_chargeback(
    chargeback_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cb = db.query(models.Chargeback).filter(models.Chargeback.id == chargeback_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Chargeback not found")

    latest_prediction = (
        db.query(models.Prediction)
        .filter(models.Prediction.chargeback_id == chargeback_id)
        .order_by(desc(models.Prediction.created_at))
        .first()
    )

    prediction_payload = None
    if latest_prediction:
        prediction_payload = {
            "risk_level": latest_prediction.risk_level,
            "win_probability": latest_prediction.win_probability,
            "recommendation": latest_prediction.recommendation,
            "top_factors": json.loads(latest_prediction.top_factors or "[]"),
            "agent_reasoning": json.loads(latest_prediction.agent_reasoning or "{}"),
        }

    return {
        "id": cb.id,
        "transaction_id": cb.transaction_id,
        "customer_id": cb.customer_id,
        "amount": cb.amount,
        "currency": cb.currency,
        "reason_code": cb.reason_code,
        "merchant_category": cb.merchant_category,
        "status": cb.status,
        "created_at": cb.created_at.isoformat(),
        "prediction": prediction_payload,
    }


@router.patch("/{chargeback_id}/status")
def update_status(
    chargeback_id: str,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if new_status not in {"open", "won", "lost", "accepted"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    cb = db.query(models.Chargeback).filter(models.Chargeback.id == chargeback_id).first()
    if not cb:
        raise HTTPException(status_code=404, detail="Chargeback not found")

    cb.status = new_status
    db.commit()

    _log_audit(db, current_user, action="status_update", details=f"{chargeback_id} -> {new_status}")
    return {"id": cb.id, "status": cb.status}
