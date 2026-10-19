"""Intraday ads pulse (read-only): today's spend, chats and cost per chat per ad, plus instant alerts.

Alerts (recommendations only — CLAUDE.md rule 1): an ad rejected / with issues, an ad that spent ≥ AED 60 with
0 chats (the pause rule), cost per chat ≥ 2x target, nothing delivered. Skips silently when nothing is running.
"""

from __future__ import annotations

import sys
from datetime import datetime

import httpx

from agent.config import Settings, load_yaml, redact
from agent.notify import telegram

FIELDS = "ad_id,ad_name,spend,impressions,reach,cpm,frequency,actions,cost_per_action_type"
CONV = "onsite_conversion.messaging_conversation_started_7d"


def _conversations(row: dict) -> int:
    return int(float(next((a["value"] for a in row.get("actions", []) if a["action_type"] == CONV), 0)))


def build(settings: Settings, http: httpx.Client) -> str | None:
    base = f"https://graph.facebook.com/{settings.meta_graph_api_version}"
    auth = {"access_token": settings.meta_access_token}
    act = settings.meta_ad_account_id if settings.meta_ad_account_id.startswith("act_") else f"act_{settings.meta_ad_account_id}"
    ads = http.get(f"{base}/{act}/ads", params={**auth, "fields": "name,effective_status,ad_review_feedback", "limit": 100}).json().get("data", [])
    live = [a for a in ads if a.get("effective_status") not in ("ARCHIVED", "DELETED", "PAUSED", "CAMPAIGN_PAUSED", "ADSET_PAUSED")]
    if not live:
        return None
    rows = http.get(f"{base}/{act}/insights", params={**auth, "level": "ad", "date_preset": "today", "fields": FIELDS}).json().get("data", [])
    targets = load_yaml("targets.yaml")
    target = float(targets["target_cost_per_conversation"])
    spend = sum(float(r.get("spend", 0)) for r in rows)
    convs = sum(_conversations(r) for r in rows)
    lines = [f"📊 Ads pulse · today so far ({datetime.now(settings.timezone):%a %d %b, %I:%M %p})",
             f"Spent AED {spend:.2f} · WhatsApp chats {convs}" + (f" · AED {spend / convs:.2f} per chat" if convs else ""), ""]
    alerts = []
    for r in sorted(rows, key=lambda r: -float(r.get("spend", 0))):
        s, c = float(r.get("spend", 0)), _conversations(r)
        lines.append(f"• {r.get('ad_name')}: AED {s:.2f} · {c} chats · {r.get('impressions', 0)} views · CPM AED {float(r.get('cpm', 0)):.0f}")
        if s >= float(targets["pause_min_spend_no_conversations"]) and c == 0:
            alerts.append(f"⚠️ {r.get('ad_name')} spent AED {s:.0f} with 0 chats → recommend PAUSE (reply 'pause' to Claude to approve)")
        elif c and s / c >= 2 * target:
            alerts.append(f"⚠️ {r.get('ad_name')} costs AED {s / c:.0f} per chat (target {target:.0f}) → watch; decide on day 3")
    for a in ads:
        if a.get("effective_status") in ("DISAPPROVED", "WITH_ISSUES") or a.get("ad_review_feedback"):
            alerts.append(f"🚫 {a.get('name')}: {a.get('effective_status')} — Meta flagged it; tell Claude to check")
    if not rows:
        alerts.append("ℹ️ No delivery yet today (ads may still be in review or waiting for their start time)")
    verdict = "✅ All normal — no changes needed (learning phase: hands off)." if not alerts else "\n".join(alerts)
    return "\n".join(lines + ["", verdict])


def main() -> int:
    settings = Settings.from_env()
    try:
        with httpx.Client(timeout=60) as http:
            text = build(settings, http)
    except Exception as e:
        print(redact(f"Pulse failed: {e}", settings.secrets()))
        return 1
    if text is None:
        print("No live ads — no pulse sent.")
        return 0
    print(text)
    if "--dry-run" not in sys.argv:
        telegram.send_message(settings.telegram_bot_token, settings.telegram_chat_id, text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
