import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

const REASON_CODES = [
  'fraud',
  'product_not_received',
  'product_unacceptable',
  'duplicate_charge',
  'subscription_cancelled',
  'credit_not_processed',
]

const MERCHANT_CATEGORIES = ['electronics', 'apparel', 'digital_goods', 'travel', 'subscription', 'general']

const DEFAULTS = {
  transaction_id: '',
  customer_id: '',
  amount: '',
  currency: 'USD',
  reason_code: 'product_not_received',
  merchant_category: 'general',
  days_since_transaction: 15,
  account_age_days: 365,
  previous_chargebacks_count: 0,
  customer_communication_count: 1,
  has_delivery_confirmation: false,
  has_signed_receipt: false,
  refund_already_issued: false,
  avs_match: true,
  cvv_match: true,
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full bg-base border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent'

export default function NewChargeback() {
  const navigate = useNavigate()
  const [form, setForm] = useState(DEFAULTS)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        days_since_transaction: parseInt(form.days_since_transaction, 10),
        account_age_days: parseInt(form.account_age_days, 10),
        previous_chargebacks_count: parseInt(form.previous_chargebacks_count, 10),
        customer_communication_count: parseInt(form.customer_communication_count, 10),
        customer_id: form.customer_id || null,
      }
      const res = await client.post('/chargebacks/predict', payload)
      navigate(`/chargebacks/${res.data.chargeback_id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not score this case. Check the fields and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Score a chargeback</h1>
      <p className="text-sm text-muted mt-0.5 mb-6">
        Enter the case details. The model predicts win probability and the agent explains why.
      </p>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 shadow-panel space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Transaction ID">
            <input
              required
              className={inputClass}
              value={form.transaction_id}
              onChange={(e) => update('transaction_id', e.target.value)}
              placeholder="TXN482910"
            />
          </Field>
          <Field label="Customer ID (optional)">
            <input
              className={inputClass}
              value={form.customer_id}
              onChange={(e) => update('customer_id', e.target.value)}
              placeholder="CUST5521"
            />
          </Field>
          <Field label="Amount">
            <input
              required
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="129.99"
            />
          </Field>
          <Field label="Reason code">
            <select
              className={inputClass}
              value={form.reason_code}
              onChange={(e) => update('reason_code', e.target.value)}
            >
              {REASON_CODES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Merchant category">
            <select
              className={inputClass}
              value={form.merchant_category}
              onChange={(e) => update('merchant_category', e.target.value)}
            >
              {MERCHANT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Days since transaction">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.days_since_transaction}
              onChange={(e) => update('days_since_transaction', e.target.value)}
            />
          </Field>
          <Field label="Account age (days)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.account_age_days}
              onChange={(e) => update('account_age_days', e.target.value)}
            />
          </Field>
          <Field label="Prior chargebacks">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.previous_chargebacks_count}
              onChange={(e) => update('previous_chargebacks_count', e.target.value)}
            />
          </Field>
          <Field label="Customer communications on record">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.customer_communication_count}
              onChange={(e) => update('customer_communication_count', e.target.value)}
            />
          </Field>
        </div>

        <div>
          <div className="text-xs text-muted mb-2">Evidence on file</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['has_delivery_confirmation', 'Delivery confirmation'],
              ['has_signed_receipt', 'Signed receipt'],
              ['refund_already_issued', 'Refund already issued'],
              ['avs_match', 'Address (AVS) match'],
              ['cvv_match', 'CVV match'],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm bg-base border border-border rounded-md px-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => update(key, e.target.checked)}
                  className="accent-accent"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-xs text-high bg-high/10 border border-high/30 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-base font-medium rounded-md px-5 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Scoring…' : 'Score this case'}
        </button>
      </form>
    </div>
  )
}
