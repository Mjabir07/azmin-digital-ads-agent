"""Optimisation rules from CLAUDE.md / PLAYBOOK section 8.

Pure functions: insights in, recommendations out. Nothing here calls Meta.
In Phase 1 every recommendation is advice for Jabir; nothing is changed automatically.
All rules use the last-7-days window.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta

from agent.ads.fetch_insights import InsightRow, Snapshot

PAUSE_AD = "pause_ad"
NEW_CREATIVES = "new_creatives"
INCREASE_BUDGET = "increase_budget"
OFFER_PROBLEM = "offer_targeting_problem"
SALES_PROBLEM = "sales_process_problem"
HOLD = "hold_learning_phase"


@dataclass
class Recommendation:
    kind: str
    level: str  # "ad", "adset" or "account"
    target_id: str
    target_name: str
    action: str
    reason: str
    data: dict = field(default_factory=dict)


@dataclass
class Funnel:
    """Lead counts for the period (from the lead tracker, Phase 2)."""

    conversations: int
    qualified: int
    won: int


def _in_learning(snapshot: Snapshot, adset_id: str, now: datetime, limits: dict) -> datetime | None:
    info = snapshot.adsets.get(adset_id)
    if not info or not info.start_time:
        return None
    ends = info.start_time + timedelta(hours=limits["learning_phase_hours"])
    return ends if now < ends else None


def evaluate(
    snapshot: Snapshot,
    targets: dict,
    limits: dict,
    now: datetime,
    funnel: Funnel | None = None,
) -> list[Recommendation]:
    recs: list[Recommendation] = []
    ads = snapshot.get("last_7d", "ad")
    adsets = {r.adset_id: r for r in snapshot.get("last_7d", "adset")}

    # Learning phase: no edits in the first 72 hours after an ad set launches.
    learning: dict[str, datetime] = {}
    for adset_id, row in adsets.items():
        ends = _in_learning(snapshot, adset_id, now, limits)
        if ends:
            learning[adset_id] = ends
            recs.append(
                Recommendation(
                    HOLD, "adset", adset_id, row.adset_name,
                    "No changes yet",
                    f"Still in the learning phase until {ends:%d %b %H:%M}. Meta needs 72 hours to learn; edits now reset it.",
                    {"learning_ends": ends.isoformat()},
                )
            )

    # Ad-level pause rules.
    for ad in ads:
        if ad.adset_id in learning:
            continue
        rec = _ad_pause(ad, adsets.get(ad.adset_id), targets)
        if rec:
            recs.append(rec)

    # Ad set rules.
    account_total = sum(a.daily_budget or 0 for a in snapshot.adsets.values() if a.status in ("ACTIVE", ""))
    for adset_id, row in adsets.items():
        if adset_id in learning:
            continue
        if row.frequency > targets["max_frequency_7d"]:
            recs.append(
                Recommendation(
                    NEW_CREATIVES, "adset", adset_id, row.adset_name,
                    "Add 2-3 new ad creatives",
                    f"Frequency is {row.frequency:.1f} over 7 days (limit {targets['max_frequency_7d']}). "
                    "The same people are seeing the ads too often, so results will get worse.",
                    {"frequency_7d": row.frequency},
                )
            )
            continue  # don't push more budget into a tired audience
        rec = _budget_increase(snapshot, row, targets, limits, now, account_total)
        if rec:
            recs.append(rec)
            account_total += rec.data["new_budget"] - rec.data["current_budget"]

    recs.extend(_funnel_rules(funnel, targets))
    return recs


def _ad_pause(ad: InsightRow, adset: InsightRow | None, targets: dict) -> Recommendation | None:
    if ad.conversations == 0 and ad.spend >= targets["pause_min_spend_no_conversations"]:
        return Recommendation(
            PAUSE_AD, "ad", ad.ad_id, ad.ad_name,
            "Pause this ad",
            f"Spent AED {ad.spend:.2f} in 7 days with 0 WhatsApp conversations "
            f"(limit AED {targets['pause_min_spend_no_conversations']}).",
            {"spend_7d": ad.spend, "adset": ad.adset_name},
        )
    if (
        adset
        and ad.cost_per_conversation is not None
        and adset.cost_per_conversation is not None
        and ad.spend >= targets["pause_cost_multiple_min_spend"]
    ):
        multiple = ad.cost_per_conversation / adset.cost_per_conversation
        if multiple >= targets["pause_cost_multiple_of_adset"]:
            return Recommendation(
                PAUSE_AD, "ad", ad.ad_id, ad.ad_name,
                "Pause this ad",
                f"Cost per conversation AED {ad.cost_per_conversation:.2f} is {multiple:.1f}x the ad set average "
                f"(AED {adset.cost_per_conversation:.2f}) after AED {ad.spend:.2f} spend.",
                {"cost_per_conversation": ad.cost_per_conversation, "adset_average": adset.cost_per_conversation, "adset": ad.adset_name},
            )
    return None


def _budget_increase(
    snapshot: Snapshot, row: InsightRow, targets: dict, limits: dict, now: datetime, account_total: float
) -> Recommendation | None:
    cpc = row.cost_per_conversation
    if cpc is None or cpc >= targets["target_cost_per_conversation"]:
        return None
    info = snapshot.adsets.get(row.adset_id)
    if info and info.start_time and now - info.start_time < timedelta(days=targets["budget_increase_min_days_running"]):
        return None  # not under target "for 7 days" yet
    if not info or info.daily_budget is None:
        return Recommendation(
            INCREASE_BUDGET, "adset", row.adset_id, row.adset_name,
            f"Raise the budget by up to {limits['budget_step_max_pct']}%",
            f"Cost per conversation AED {cpc:.2f} is under the AED {targets['target_cost_per_conversation']} target over 7 days. "
            "(Ad set budget not found - it may use a campaign budget.)",
            {"cost_per_conversation": cpc},
        )
    current = info.daily_budget
    new = round(min(current * (1 + limits["budget_step_max_pct"] / 100), limits["adset_daily_budget_max"]), 2)
    new = min(new, round(current + limits["account_daily_budget_max"] - account_total, 2))
    if new <= current:
        return None  # already at a ceiling
    return Recommendation(
        INCREASE_BUDGET, "adset", row.adset_id, row.adset_name,
        f"Raise daily budget AED {current:.2f} -> AED {new:.2f}",
        f"Cost per conversation AED {cpc:.2f} is under the AED {targets['target_cost_per_conversation']} target over 7 days. "
        f"Max +{limits['budget_step_max_pct']}% at a time, then wait {limits['budget_cooldown_hours']} hours.",
        {"cost_per_conversation": cpc, "current_budget": current, "new_budget": new},
    )


def _funnel_rules(funnel: Funnel | None, targets: dict) -> list[Recommendation]:
    if not funnel or funnel.conversations < targets["min_conversations_for_funnel_check"]:
        return []
    recs = []
    qual_rate = funnel.qualified / funnel.conversations
    if qual_rate < targets["min_qualification_rate"]:
        recs.append(
            Recommendation(
                OFFER_PROBLEM, "account", "", "Account",
                "Review the offer and targeting",
                f"Only {qual_rate:.0%} of {funnel.conversations} chats qualified (target at least {targets['min_qualification_rate']:.0%}).",
                {"qualification_rate": round(qual_rate, 3)},
            )
        )
    if funnel.qualified:
        close_rate = funnel.won / funnel.qualified
        if close_rate < targets["min_close_rate"]:
            recs.append(
                Recommendation(
                    SALES_PROBLEM, "account", "", "Account",
                    "Review the sales process",
                    f"Only {close_rate:.0%} of {funnel.qualified} qualified leads became clients (target at least {targets['min_close_rate']:.0%}).",
                    {"close_rate": round(close_rate, 3)},
                )
            )
    return recs
