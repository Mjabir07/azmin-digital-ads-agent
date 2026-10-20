"""Read-only ads funnel diagnosis: where do people drop off? Sends a breakdown to Telegram.

Funnel per ad and per breakdown (placement, age, region): views → clicks (CTR) → WhatsApp chats started.
Low CTR = the creative/hook isn't stopping the scroll. Clicks but no chats = friction after the tap
(WhatsApp welcome screen, wrong expectation). Only reads data; never changes ads.
"""

from __future__ import annotations

import json
import sys

import httpx

from agent.config import Settings, redact
from agent.notify import telegram

CONV = "onsite_conversion.messaging_conversation_started_7d"
FIELDS = "ad_name,spend,impressions,reach,frequency,cpm,clicks,inline_link_clicks,ctr,actions"


def act_val(row: dict, kind: str) -> int:
    return int(float(next((a["value"] for a in row.get("actions", []) if a["action_type"] == kind), 0)))


def line(label: str, r: dict) -> str:
    spend, imp, clk = float(r.get("spend", 0)), int(r.get("impressions", 0)), int(r.get("inline_link_clicks") or r.get("clicks") or 0)
    conv = act_val(r, CONV)
    ctr = clk / imp * 100 if imp else 0
    return (f"• {label}: AED {spend:.2f} · {imp} views · {clk} clicks (CTR {ctr:.1f}%) · {conv} chats"
            + (f" · AED {spend / conv:.0f}/chat" if conv else ""))


def main() -> int:
    s = Settings.from_env()
    base = f"https://graph.facebook.com/{s.meta_graph_api_version}"
    act = s.meta_ad_account_id if s.meta_ad_account_id.startswith("act_") else f"act_{s.meta_ad_account_id}"
    auth = {"access_token": s.meta_access_token}
    out = ["🔎 Ads diagnosis (campaign lifetime, read-only)"]
    try:
        with httpx.Client(timeout=60) as http:
            def get(**p):
                return http.get(f"{base}/{act}/insights", params={**auth, "date_preset": "maximum", **p}).json().get("data", [])
            total = get(level="account", fields=FIELDS)
            if total:
                t = total[0]
                out.append(line("TOTAL", t) + f" · freq {float(t.get('frequency', 0)):.2f}")
                kinds = {a["action_type"]: a["value"] for a in t.get("actions", [])}
                out.append("Actions: " + ", ".join(f"{k.split('.')[-1]}={v}" for k, v in sorted(kinds.items())))
            out.append("\nBy ad:")
            out += [line(r.get("ad_name", "?"), r) for r in get(level="ad", fields=FIELDS)]
            for title, bd in [("By placement", "publisher_platform,platform_position"), ("By age", "age"), ("By region", "region")]:
                rows = sorted(get(level="account", fields=FIELDS, breakdowns=bd), key=lambda r: -float(r.get("spend", 0)))
                out.append(f"\n{title}:")
                out += [line(" / ".join(str(r.get(k, "")) for k in bd.split(",")), r) for r in rows[:8]]
            ads = http.get(f"{base}/{act}/ads", params={**auth, "fields": "name,effective_status,ad_review_feedback", "limit": 50}).json().get("data", [])
            out.append("\nAd status: " + "; ".join(f"{a['name']}={a['effective_status']}" for a in ads))
    except Exception as e:
        out.append(redact(f"Error: {e}", s.secrets()))
    text = "\n".join(out)
    print(text)
    if "--telegram" in sys.argv:
        telegram.send_message(s.telegram_bot_token, s.telegram_chat_id, text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
