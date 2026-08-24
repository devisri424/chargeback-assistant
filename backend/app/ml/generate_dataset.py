"""
Generates a synthetic chargeback dataset.

Target column `won_dispute`:
    1 = merchant would win the dispute (evidence strong, chargeback representment succeeds)
    0 = merchant would lose the dispute (chargeback stands, funds go back to cardholder)

Run:
    python -m app.ml.generate_dataset
"""
import os
import numpy as np
import pandas as pd

REASON_CODES = [
    "fraud",
    "product_not_received",
    "product_unacceptable",
    "duplicate_charge",
    "subscription_cancelled",
    "credit_not_processed",
]

MERCHANT_CATEGORIES = ["electronics", "apparel", "digital_goods", "travel", "subscription", "general"]

N_ROWS = 4000
SEED = 42


def generate(n_rows: int = N_ROWS, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    reason_code = rng.choice(REASON_CODES, size=n_rows, p=[0.22, 0.22, 0.14, 0.14, 0.14, 0.14])
    merchant_category = rng.choice(MERCHANT_CATEGORIES, size=n_rows)

    amount = np.round(rng.gamma(shape=2.0, scale=90, size=n_rows) + 5, 2)
    days_since_transaction = rng.integers(1, 120, size=n_rows)
    account_age_days = rng.integers(0, 2500, size=n_rows)
    previous_chargebacks_count = rng.poisson(0.4, size=n_rows)
    customer_communication_count = rng.poisson(1.5, size=n_rows)

    has_delivery_confirmation = rng.choice([0, 1], size=n_rows, p=[0.35, 0.65])
    has_signed_receipt = rng.choice([0, 1], size=n_rows, p=[0.6, 0.4])
    refund_already_issued = rng.choice([0, 1], size=n_rows, p=[0.85, 0.15])
    avs_match = rng.choice([0, 1], size=n_rows, p=[0.15, 0.85])
    cvv_match = rng.choice([0, 1], size=n_rows, p=[0.1, 0.9])

    df = pd.DataFrame(
        {
            "amount": amount,
            "reason_code": reason_code,
            "merchant_category": merchant_category,
            "days_since_transaction": days_since_transaction,
            "account_age_days": account_age_days,
            "previous_chargebacks_count": previous_chargebacks_count,
            "customer_communication_count": customer_communication_count,
            "has_delivery_confirmation": has_delivery_confirmation,
            "has_signed_receipt": has_signed_receipt,
            "refund_already_issued": refund_already_issued,
            "avs_match": avs_match,
            "cvv_match": cvv_match,
        }
    )

    # ---- Latent "true" win-probability model used to label the synthetic data ----
    score = np.zeros(n_rows)

    # Strong evidence increases odds of winning
    score += df["has_delivery_confirmation"] * 1.6
    score += df["has_signed_receipt"] * 1.0
    score += df["avs_match"] * 0.8
    score += df["cvv_match"] * 0.6
    score += (df["customer_communication_count"].clip(upper=5)) * 0.15

    # Bad signals decrease odds of winning
    score -= df["refund_already_issued"] * 2.2  # refunded already -> basically auto-loss
    score -= df["previous_chargebacks_count"] * 0.5
    score -= (df["days_since_transaction"] > 60).astype(int) * 0.6  # evidence goes stale
    score -= (df["account_age_days"] < 30).astype(int) * 0.7  # brand-new accounts are risky

    # Reason code baseline difficulty (fraud claims and "unacceptable" are hard to win)
    reason_penalty = {
        "fraud": -1.4,
        "product_not_received": -0.2,
        "product_unacceptable": -0.9,
        "duplicate_charge": 1.1,
        "subscription_cancelled": -0.3,
        "credit_not_processed": -0.5,
    }
    score += df["reason_code"].map(reason_penalty).values

    # Large amounts are scrutinized harder by issuers
    score -= (df["amount"] > 500).astype(int) * 0.4

    # Add noise
    score += rng.normal(0, 0.9, size=n_rows)

    prob_win = 1 / (1 + np.exp(-score))
    won_dispute = rng.binomial(1, prob_win)

    df["won_dispute"] = won_dispute
    df["transaction_id"] = [f"TXN{100000 + i}" for i in range(n_rows)]

    cols = ["transaction_id"] + [c for c in df.columns if c != "transaction_id"]
    return df[cols]


if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "chargebacks.csv")

    df = generate()
    df.to_csv(out_path, index=False)
    print(f"Wrote {len(df)} rows to {out_path}")
    print(df["won_dispute"].value_counts(normalize=True))
