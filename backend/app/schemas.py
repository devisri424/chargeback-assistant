from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Chargeback input ----------
class ChargebackInput(BaseModel):
    transaction_id: str
    customer_id: Optional[str] = None
    amount: float
    currency: str = "USD"
    reason_code: str  # fraud | product_not_received | product_unacceptable |
    # duplicate_charge | subscription_cancelled | credit_not_processed | other
    merchant_category: Optional[str] = "general"

    days_since_transaction: int = 0
    account_age_days: int = 0
    previous_chargebacks_count: int = 0
    customer_communication_count: int = 0

    has_delivery_confirmation: bool = False
    has_signed_receipt: bool = False
    refund_already_issued: bool = False
    avs_match: bool = True
    cvv_match: bool = True


class ChargebackOut(ChargebackInput):
    id: str
    status: str

    class Config:
        from_attributes = True


# ---------- Prediction ----------
class PredictionResult(BaseModel):
    chargeback_id: str
    risk_level: str
    win_probability: float
    recommendation: str
    top_factors: List[Dict[str, Any]]
    agent_reasoning: Dict[str, Any]

    class Config:
        from_attributes = True


# ---------- Audit ----------
class AuditLogOut(BaseModel):
    id: str
    action: str
    details: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
