import datetime
import uuid

from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="analyst")  # analyst | admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Chargeback(Base):
    __tablename__ = "chargebacks"

    id = Column(String, primary_key=True, default=gen_uuid)
    transaction_id = Column(String, index=True, nullable=False)
    customer_id = Column(String, index=True, nullable=True)

    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    reason_code = Column(String, nullable=False)  # e.g. fraud, PNR, duplicate...
    merchant_category = Column(String, nullable=True)

    days_since_transaction = Column(Integer, default=0)
    account_age_days = Column(Integer, default=0)
    previous_chargebacks_count = Column(Integer, default=0)
    customer_communication_count = Column(Integer, default=0)

    has_delivery_confirmation = Column(Boolean, default=False)
    has_signed_receipt = Column(Boolean, default=False)
    refund_already_issued = Column(Boolean, default=False)
    avs_match = Column(Boolean, default=True)
    cvv_match = Column(Boolean, default=True)

    status = Column(String, default="open")  # open | won | lost | accepted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    predictions = relationship("Prediction", back_populates="chargeback")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, default=gen_uuid)
    chargeback_id = Column(String, ForeignKey("chargebacks.id"), nullable=False)

    risk_level = Column(String, nullable=False)  # Low | Medium | High
    win_probability = Column(Float, nullable=False)  # probability of winning dispute
    recommendation = Column(String, nullable=False)
    top_factors = Column(Text, nullable=True)  # JSON-encoded SHAP factors
    agent_reasoning = Column(Text, nullable=True)  # JSON-encoded agent trace

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    chargeback = relationship("Chargeback", back_populates="predictions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
