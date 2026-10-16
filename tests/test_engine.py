from datetime import timedelta

from agent.ads.fetch_insights import AdSetInfo, InsightRow, Snapshot
from agent.rules.engine import (
    HOLD, INCREASE_BUDGET, NEW_CREATIVES, OFFER_PROBLEM, PAUSE_AD, SALES_PROBLEM, Funnel, evaluate,
)


def row(level, adset_id="s1", ad_id="", spend=0.0, conv=0, freq=1.0, name=None):
    return InsightRow(
        level=level, window="last_7d", date_start="", date_stop="", campaign_id="c1", campaign_name="Camp",
        adset_id=adset_id, adset_name=f"Set {adset_id}", ad_id=ad_id, ad_name=name or f"Ad {ad_id}",
        spend=spend, impressions=1000, cpm=20.0, link_ctr=1.0, frequency=freq, conversations=conv,
    )


def snap(ads, adsets, infos, report_date=None):
    from datetime import date

    return Snapshot(
        report_date=report_date or date(2026, 10, 14),
        rows={"last_7d": {"ad": ads, "adset": adsets, "campaign": []}, "yesterday": {}},
        adsets={i.id: i for i in infos},
    )


def info(now, adset_id="s1", days=10, budget=37.5, status="ACTIVE"):
    return AdSetInfo(adset_id, f"Set {adset_id}", status, budget, now - timedelta(days=days))


def kinds(recs):
    return sorted(r.kind for r in recs)


# --- Sample data: the full picture --------------------------------------------------------

def test_sample_data_recommendations(snapshot, targets, limits, now):
    recs = evaluate(snapshot, targets, limits, now)
    by_name = {(r.kind, r.target_name) for r in recs}
    assert (PAUSE_AD, "Pain-Reel") in by_name            # AED 65, 0 conversations
    assert (PAUSE_AD, "Audit-Static") in by_name         # 47.50 vs ad set 21.25 = 2.2x
    assert (NEW_CREATIVES, "UAE | Interests | SME owners") in by_name  # frequency 3.4
    assert (INCREASE_BUDGET, "UAE | Broad | 25-55") in by_name         # 22.78 < 25
    assert len(recs) == 4
    budget = next(r for r in recs if r.kind == INCREASE_BUDGET)
    assert budget.data == {"cost_per_conversation": 22.78, "current_budget": 37.5, "new_budget": 45.0}


# --- Rule 1: spend >= 60 with no conversations ----------------------------------------------

def test_pause_ad_with_spend_and_no_conversations(targets, limits, now):
    s = snap([row("ad", ad_id="a1", spend=60.0)], [row("adset", spend=200, conv=5)], [info(now)])  # avg 40: no budget rec
    assert kinds(evaluate(s, targets, limits, now)) == [PAUSE_AD]


def test_no_pause_just_under_60(targets, limits, now):
    s = snap([row("ad", ad_id="a1", spend=59.99)], [row("adset", spend=100, conv=2, freq=1)], [info(now, budget=None)])
    assert PAUSE_AD not in kinds(evaluate(s, targets, limits, now))


# --- Rule 2: cost per conversation >= 2x ad set average after >= 80 spend ----------------

def test_pause_expensive_ad(targets, limits, now):
    ads = [row("ad", ad_id="a1", spend=80.0, conv=1), row("ad", ad_id="a2", spend=120.0, conv=9)]
    s = snap(ads, [row("adset", spend=200, conv=10)], [info(now)])  # avg 20, a1 = 80 (4x)
    recs = [r for r in evaluate(s, targets, limits, now) if r.kind == PAUSE_AD]
    assert [r.target_id for r in recs] == ["a1"]


def test_expensive_ad_below_80_spend_is_left_alone(targets, limits, now):
    ads = [row("ad", ad_id="a1", spend=79.0, conv=1), row("ad", ad_id="a2", spend=121.0, conv=9)]
    s = snap(ads, [row("adset", spend=200, conv=10)], [info(now)])
    assert PAUSE_AD not in kinds(evaluate(s, targets, limits, now))


def test_ad_just_under_2x_is_left_alone(targets, limits, now):
    ads = [row("ad", ad_id="a1", spend=90.0, conv=3)]  # 30 vs avg 16 -> 1.875x
    s = snap(ads, [row("adset", spend=160, conv=10)], [info(now)])
    assert PAUSE_AD not in kinds(evaluate(s, targets, limits, now))


# --- Rule 3: frequency > 3 ---------------------------------------------------------------

def test_high_frequency_asks_for_new_creatives_and_no_budget_increase(targets, limits, now):
    s = snap([], [row("adset", spend=100, conv=10, freq=3.01)], [info(now)])
    assert kinds(evaluate(s, targets, limits, now)) == [NEW_CREATIVES]


def test_frequency_exactly_3_is_fine(targets, limits, now):
    s = snap([], [row("adset", spend=300, conv=10, freq=3.0)], [info(now)])
    assert evaluate(s, targets, limits, now) == []


# --- Rule 4: under target -> +20% within ceilings ---------------------------------------

def test_budget_increase_is_20_percent(targets, limits, now):
    s = snap([], [row("adset", spend=200, conv=10)], [info(now, budget=50)])
    (rec,) = evaluate(s, targets, limits, now)
    assert rec.kind == INCREASE_BUDGET and rec.data["new_budget"] == 60.0


def test_budget_increase_capped_at_adset_ceiling(targets, limits, now):
    s = snap([], [row("adset", spend=200, conv=10)], [info(now, budget=140)])
    (rec,) = evaluate(s, targets, limits, now)
    assert rec.data["new_budget"] == 150.0


def test_no_budget_increase_when_already_at_ceiling(targets, limits, now):
    s = snap([], [row("adset", spend=200, conv=10)], [info(now, budget=150)])
    assert evaluate(s, targets, limits, now) == []


def test_budget_increase_respects_account_ceiling(targets, limits, now):
    adsets = [row("adset", adset_id="s1", spend=200, conv=10), row("adset", adset_id="s2", spend=200, conv=10)]
    infos = [info(now, "s1", budget=145), info(now, "s2", budget=145)]  # total 290 of 300
    recs = evaluate(snap([], adsets, infos), targets, limits, now)
    assert [r.data["new_budget"] for r in recs] == [150.0, 150.0][:len(recs)]
    total = 290 + sum(r.data["new_budget"] - r.data["current_budget"] for r in recs)
    assert total <= 300


def test_no_budget_increase_at_or_above_target(targets, limits, now):
    s = snap([], [row("adset", spend=250, conv=10)], [info(now)])  # exactly 25
    assert evaluate(s, targets, limits, now) == []


def test_no_budget_increase_before_7_days(targets, limits, now):
    s = snap([], [row("adset", spend=200, conv=10)], [info(now, days=5)])
    assert evaluate(s, targets, limits, now) == []


def test_no_budget_increase_without_conversations(targets, limits, now):
    s = snap([], [row("adset", spend=0, conv=0)], [info(now)])
    assert evaluate(s, targets, limits, now) == []


# --- Learning phase: no edits in first 72 hours -----------------------------------------

def test_learning_phase_blocks_all_recommendations(targets, limits, now):
    young = AdSetInfo("s1", "Set s1", "ACTIVE", 37.5, now - timedelta(hours=48))
    s = snap([row("ad", ad_id="a1", spend=100.0)], [row("adset", spend=100, conv=0, freq=4)], [young])
    assert kinds(evaluate(s, targets, limits, now)) == [HOLD]


def test_learning_phase_ends_after_72_hours(targets, limits, now):
    older = AdSetInfo("s1", "Set s1", "ACTIVE", 37.5, now - timedelta(hours=73))
    s = snap([row("ad", ad_id="a1", spend=100.0)], [row("adset", spend=100, conv=0)], [older])
    assert kinds(evaluate(s, targets, limits, now)) == [PAUSE_AD]


# --- Rules 5 & 6: funnel (lead data, Phase 2) -----------------------------------------------

def test_low_qualification_rate(targets, limits, now):
    recs = evaluate(snap([], [], []), targets, limits, now, Funnel(conversations=40, qualified=5, won=1))
    assert kinds(recs) == [OFFER_PROBLEM]


def test_low_close_rate(targets, limits, now):
    recs = evaluate(snap([], [], []), targets, limits, now, Funnel(conversations=40, qualified=25, won=1))
    assert kinds(recs) == [SALES_PROBLEM]


def test_funnel_needs_enough_chats(targets, limits, now):
    recs = evaluate(snap([], [], []), targets, limits, now, Funnel(conversations=10, qualified=0, won=0))
    assert recs == []
