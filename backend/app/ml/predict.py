"""
Loads trained model artifacts and produces predictions + SHAP explanations
for a single chargeback case.
"""
import os
import json
from functools import lru_cache
from typing import Dict, Any, List

import joblib
import numpy as np
import pandas as pd
import shap

HERE = os.path.dirname(__file__)
ARTIFACT_DIR = os.path.join(HERE, "artifacts")


@lru_cache(maxsize=1)
def _load_artifacts():
    model = joblib.load(os.path.join(ARTIFACT_DIR, "model.pkl"))
    preprocessor = joblib.load(os.path.join(ARTIFACT_DIR, "preprocessor.pkl"))
    with open(os.path.join(ARTIFACT_DIR, "feature_config.json")) as f:
        feature_config = json.load(f)
    explainer = shap.TreeExplainer(model)
    return model, preprocessor, feature_config, explainer


def _feature_names(preprocessor, feature_config) -> List[str]:
    num_names = feature_config["numeric"]
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_names = list(cat_encoder.get_feature_names_out(feature_config["categorical"]))
    return num_names + cat_names


def risk_level_from_probability(win_probability: float) -> str:
    """
    win_probability = probability the MERCHANT wins the dispute.
    Risk here means "risk of losing money" -> inverse of win probability.
    """
    loss_probability = 1 - win_probability
    if loss_probability >= 0.6:
        return "High"
    if loss_probability >= 0.3:
        return "Medium"
    return "Low"


def recommend_action(win_probability: float, chargeback: Dict[str, Any]) -> str:
    if chargeback.get("refund_already_issued"):
        return "Accept liability — refund was already issued, representment will not succeed."
    if win_probability >= 0.65:
        return "Fight the dispute — submit compiled evidence for representment."
    if win_probability >= 0.4:
        return "Gather more evidence before responding (delivery/signature proof, customer comms)."
    return "Accept liability — evidence is too weak to win representment; issuing a refund may be cheaper than dispute fees."


def predict_chargeback(chargeback: Dict[str, Any]) -> Dict[str, Any]:
    model, preprocessor, feature_config, explainer = _load_artifacts()

    row = {k: chargeback[k] for k in feature_config["numeric"] + feature_config["categorical"]}
    # cast booleans to ints for the numeric pipeline
    for k in feature_config["numeric"]:
        if isinstance(row[k], bool):
            row[k] = int(row[k])

    X = pd.DataFrame([row])
    X_t = preprocessor.transform(X)
    if hasattr(X_t, "toarray"):
        X_t = X_t.toarray()

    win_probability = float(model.predict_proba(X_t)[0, 1])
    risk_level = risk_level_from_probability(win_probability)
    recommendation = recommend_action(win_probability, chargeback)

    shap_values = explainer.shap_values(X_t)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]  # class 1 (win) contributions
    shap_row = np.array(shap_values).flatten()

    names = _feature_names(preprocessor, feature_config)
    contributions = sorted(
        zip(names, shap_row.tolist()), key=lambda x: abs(x[1]), reverse=True
    )

    top_factors = []
    for name, value in contributions[:5]:
        top_factors.append(
            {
                "feature": _humanize(name),
                "impact": round(value, 4),
                "direction": "increases win probability" if value > 0 else "decreases win probability",
            }
        )

    return {
        "risk_level": risk_level,
        "win_probability": round(win_probability, 4),
        "recommendation": recommendation,
        "top_factors": top_factors,
    }


def _humanize(feature_name: str) -> str:
    mapping = {
        "has_delivery_confirmation": "Delivery confirmation on file",
        "has_signed_receipt": "Signed receipt on file",
        "refund_already_issued": "Refund already issued",
        "avs_match": "Address (AVS) match",
        "cvv_match": "CVV match",
        "previous_chargebacks_count": "Prior chargeback count",
        "days_since_transaction": "Days since transaction",
        "account_age_days": "Account age (days)",
        "customer_communication_count": "Customer communication count",
        "amount": "Transaction amount",
    }
    if feature_name in mapping:
        return mapping[feature_name]
    if feature_name.startswith("reason_code_"):
        return f"Reason code: {feature_name.replace('reason_code_', '').replace('_', ' ')}"
    if feature_name.startswith("merchant_category_"):
        return f"Merchant category: {feature_name.replace('merchant_category_', '').replace('_', ' ')}"
    return feature_name
