"""
LangGraph agent that turns a raw model prediction + SHAP factors into a
structured investigation trace: analyze -> explain -> recommend.

By default this runs fully deterministically (no LLM call needed, so the
whole project works offline / without an API key). If ANTHROPIC_API_KEY is
set, `narrate_with_llm` can be swapped in to turn the trace into free-text
analyst notes.
"""
from typing import TypedDict, List, Dict, Any

from langgraph.graph import StateGraph, END

from app.config import settings


class AgentState(TypedDict, total=False):
    chargeback: Dict[str, Any]
    win_probability: float
    risk_level: str
    top_factors: List[Dict[str, Any]]
    findings: List[str]
    recommendation: str
    narrative: str


def analyze_risk(state: AgentState) -> AgentState:
    findings = []
    cb = state["chargeback"]
    wp = state["win_probability"]

    findings.append(
        f"Model estimates a {wp * 100:.0f}% probability of winning representment "
        f"({state['risk_level']} risk of loss)."
    )

    if cb.get("refund_already_issued"):
        findings.append("A refund was already issued for this transaction.")
    if cb.get("previous_chargebacks_count", 0) >= 2:
        findings.append(
            f"Customer has {cb['previous_chargebacks_count']} prior chargebacks — repeat-dispute pattern."
        )
    if cb.get("days_since_transaction", 0) > 60:
        findings.append("Dispute was filed long after the transaction; evidence may be stale.")
    if cb.get("account_age_days", 0) < 30:
        findings.append("Account is less than 30 days old — limited trust history.")

    state["findings"] = findings
    return state


def explain_factors(state: AgentState) -> AgentState:
    factor_lines = []
    for f in state.get("top_factors", []):
        symbol = "✓" if f["impact"] > 0 else "✗"
        factor_lines.append(f"{symbol} {f['feature']} ({f['direction']})")
    state["findings"] = state.get("findings", []) + factor_lines
    return state


def recommend(state: AgentState) -> AgentState:
    # recommendation already computed by the ML layer and passed in;
    # this node just finalizes the structured trace.
    state["narrative"] = " ".join(state.get("findings", []))
    return state


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("analyze_risk", analyze_risk)
    graph.add_node("explain_factors", explain_factors)
    graph.add_node("recommend", recommend)

    graph.set_entry_point("analyze_risk")
    graph.add_edge("analyze_risk", "explain_factors")
    graph.add_edge("explain_factors", "recommend")
    graph.add_edge("recommend", END)

    return graph.compile()


_compiled_graph = None


def run_agent(
    chargeback: Dict[str, Any],
    win_probability: float,
    risk_level: str,
    top_factors: List[Dict[str, Any]],
    recommendation: str,
) -> Dict[str, Any]:
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()

    initial_state: AgentState = {
        "chargeback": chargeback,
        "win_probability": win_probability,
        "risk_level": risk_level,
        "top_factors": top_factors,
        "recommendation": recommendation,
    }

    result = _compiled_graph.invoke(initial_state)

    return {
        "risk_level": risk_level,
        "win_probability": win_probability,
        "findings": result.get("findings", []),
        "recommendation": recommendation,
        "narrative": result.get("narrative", ""),
    }
