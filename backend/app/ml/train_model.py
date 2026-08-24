"""
Trains the chargeback win/loss prediction model.

Run:
    python -m app.ml.train_model
"""
import os
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from xgboost import XGBClassifier

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "..", "..", "data", "chargebacks.csv")
ARTIFACT_DIR = os.path.join(HERE, "artifacts")

NUMERIC_FEATURES = [
    "amount",
    "days_since_transaction",
    "account_age_days",
    "previous_chargebacks_count",
    "customer_communication_count",
    "has_delivery_confirmation",
    "has_signed_receipt",
    "refund_already_issued",
    "avs_match",
    "cvv_match",
]
CATEGORICAL_FEATURES = ["reason_code", "merchant_category"]
TARGET = "won_dispute"


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def main():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"No dataset at {DATA_PATH}. Run `python -m app.ml.generate_dataset` first."
        )

    df = pd.read_csv(DATA_PATH)

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = build_preprocessor()
    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t = preprocessor.transform(X_test)

    model = XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train_t, y_train)

    y_pred = model.predict(X_test_t)
    y_proba = model.predict_proba(X_test_t)[:, 1]

    report = classification_report(y_test, y_pred, output_dict=True)
    cm = confusion_matrix(y_test, y_pred).tolist()
    fp = cm[0][1] if len(cm) > 1 else 0
    tn = cm[0][0] if len(cm) > 1 else 0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

    metrics = {
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1_score": f1_score(y_test, y_pred),
        "false_positive_rate": fpr,
        "confusion_matrix": cm,
        "classification_report": report,
    }

    print(classification_report(y_test, y_pred))
    print("Confusion matrix:", cm)
    print(f"False positive rate: {fpr:.3f}")

    # Persist artifacts
    joblib.dump(model, os.path.join(ARTIFACT_DIR, "model.pkl"))
    joblib.dump(preprocessor, os.path.join(ARTIFACT_DIR, "preprocessor.pkl"))
    with open(os.path.join(ARTIFACT_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2, default=str)
    with open(os.path.join(ARTIFACT_DIR, "feature_config.json"), "w") as f:
        json.dump(
            {"numeric": NUMERIC_FEATURES, "categorical": CATEGORICAL_FEATURES},
            f,
            indent=2,
        )

    print(f"\nArtifacts saved to {ARTIFACT_DIR}")


if __name__ == "__main__":
    main()
