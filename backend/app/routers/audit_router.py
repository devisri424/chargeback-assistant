from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(tags=["audit"])


@router.get("/audit")
def list_audit_logs(
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    logs = (
        db.query(models.AuditLog)
        .order_by(desc(models.AuditLog.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


@router.get("/analytics/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    total = db.query(func.count(models.Chargeback.id)).scalar() or 0

    risk_rows = (
        db.query(models.Prediction.risk_level, func.count(models.Prediction.id))
        .group_by(models.Prediction.risk_level)
        .all()
    )
    risk_counts = {level: count for level, count in risk_rows}
    for level in ["Low", "Medium", "High"]:
        risk_counts.setdefault(level, 0)

    reason_rows = (
        db.query(models.Chargeback.reason_code, func.count(models.Chargeback.id))
        .group_by(models.Chargeback.reason_code)
        .all()
    )
    reason_counts = {reason: count for reason, count in reason_rows}

    status_rows = (
        db.query(models.Chargeback.status, func.count(models.Chargeback.id))
        .group_by(models.Chargeback.status)
        .all()
    )
    status_counts = {s: count for s, count in status_rows}

    avg_win_prob = db.query(func.avg(models.Prediction.win_probability)).scalar()

    return {
        "total_chargebacks": total,
        "risk_distribution": risk_counts,
        "reason_code_distribution": reason_counts,
        "status_distribution": status_counts,
        "average_win_probability": round(avg_win_prob, 4) if avg_win_prob else None,
    }
