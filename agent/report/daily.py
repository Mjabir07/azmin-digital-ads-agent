"""Daily plain-English report.

`build_facts` turns the snapshot + recommendations into a small JSON summary.
`write_with_claude` asks Claude to write the report from those facts.
`write_template` is a no-AI fallback so Jabir always gets a report.
"""

from __future__ import annotations

import json

from agent.ads.fetch_insights import InsightRow, Snapshot
from agent.rules.engine import HOLD, Recommendation


def _totals(rows: list[InsightRow]) -> dict:
    spend = round(sum(r.spend for r in rows), 2)
    impressions = sum(r.impressions for r in rows)
    conversations = sum(r.conversations for r in rows)
    return {
        "spend": spend,
        "impressions": impressions,
        "conversations": conversations,
        "cost_per_conversation": round(spend / conversations, 2) if conversations else None,
        "cpm": round(spend / impressions * 1000, 2) if impressions else None,
    }


def _row(r: InsightRow) -> dict:
    out = {
        "name": r.name,
        "spend": r.spend,
        "conversations": r.conversations,
        "cost_per_conversation": r.cost_per_conversation,
        "cpm": r.cpm,
        "link_ctr_pct": r.link_ctr,
    }
    if r.level == "adset":
        out["frequency"] = r.frequency
    if r.level == "ad":
        out["adset"] = r.adset_name
    return out


def build_facts(snapshot: Snapshot, recs: list[Recommendation], targets: dict) -> dict:
    return {
        "report_date": snapshot.report_date.isoformat(),
        "currency": targets.get("currency", "AED"),
        "targets": {
            "cost_per_conversation": targets["target_cost_per_conversation"],
            **targets.get("kpi", {}),
        },
        "yesterday": _totals(snapshot.get("yesterday", "campaign")),
        "last_7_days": _totals(snapshot.get("last_7d", "campaign")),
        "ad_sets_last_7_days": [_row(r) for r in snapshot.get("last_7d", "adset")],
        "ads_last_7_days": [_row(r) for r in sorted(snapshot.get("last_7d", "ad"), key=lambda r: -r.spend)],
        "recommendations": [
            {"type": r.kind, "level": r.level, "name": r.target_name, "action": r.action, "reason": r.reason}
            for r in recs
        ],
    }


SYSTEM_PROMPT = """You write the daily Meta ads report for Jabir, owner of AZMIN DIGITAL, a Dubai web design agency \
running Click-to-WhatsApp ads that sell website packages to small businesses in the UAE. \
Jabir is new to Meta ads, so use plain English and short sentences, and explain any ad term the first time you use it.

The report is read on a phone in Telegram, so use plain text only: no Markdown, no tables, no asterisks. \
Short lines, simple dashes for lists, emoji only as section markers. Keep it under 250 words.

Structure:
1. Headline - one sentence on how yesterday went.
2. Numbers - yesterday and last 7 days: spend, WhatsApp conversations, cost per conversation, compared with the target.
3. What to do today - each recommendation as one line with the action, then one short line on why. \
If there are none, say nothing needs changing.
4. One sentence on what to watch tomorrow.

Use only the numbers in the facts; never invent figures, prices or results. Amounts are in AED. \
Recommendations are suggestions only: the agent has not changed anything in Meta, and Jabir decides."""


def write_with_claude(facts: dict, api_key: str, model: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=api_key, max_retries=3)
    response = client.beta.messages.create(
        model=model,
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        output_config={"effort": "medium"},
        # If a request is ever declined, the API retries it on a fallback model automatically.
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        messages=[{"role": "user", "content": "Facts for today's report (JSON):\n" + json.dumps(facts, indent=1)}],
    )
    if response.stop_reason == "refusal":
        raise RuntimeError("Claude declined to write the report")
    text = "".join(b.text for b in response.content if b.type == "text").strip()
    if not text:
        raise RuntimeError("Claude returned an empty report")
    return text


def _money(v) -> str:
    return "n/a" if v is None else f"AED {v:,.2f}"


def write_template(facts: dict) -> str:
    y, w = facts["yesterday"], facts["last_7_days"]
    target = facts["targets"]["cost_per_conversation"]
    lines = [
        f"📊 AZMIN DIGITAL ads report - {facts['report_date']}",
        "",
        "Yesterday",
        f"- Spend: {_money(y['spend'])}",
        f"- WhatsApp conversations: {y['conversations']}",
        f"- Cost per conversation: {_money(y['cost_per_conversation'])} (target {_money(target)})",
        "",
        "Last 7 days",
        f"- Spend: {_money(w['spend'])}",
        f"- WhatsApp conversations: {w['conversations']}",
        f"- Cost per conversation: {_money(w['cost_per_conversation'])}",
        f"- CPM (cost per 1,000 views): {_money(w['cpm'])}",
        "",
        "Ad sets (7 days)",
    ]
    for a in facts["ad_sets_last_7_days"]:
        lines.append(
            f"- {a['name']}: {_money(a['spend'])}, {a['conversations']} chats, "
            f"{_money(a['cost_per_conversation'])}/chat, frequency {a.get('frequency', 0):.1f}"
        )
    lines += ["", "✅ What to do today"]
    actions = [r for r in facts["recommendations"] if r["type"] != HOLD]
    holds = [r for r in facts["recommendations"] if r["type"] == HOLD]
    if not actions:
        lines.append("- Nothing needs changing today.")
    for r in actions:
        lines.append(f"- {r['name']}: {r['action']}")
        lines.append(f"  Why: {r['reason']}")
    for r in holds:
        lines.append(f"- {r['name']}: {r['action']}. {r['reason']}")
    lines += ["", "Nothing was changed in Meta. These are suggestions - you decide."]
    return "\n".join(lines)
