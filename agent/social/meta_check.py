"""Read-only check of the Meta connection (system user token).

Lists the Pages and Instagram accounts the token can reach and which permissions it has.
GET requests only - nothing is posted or changed. The token is never printed.
Run by .github/workflows/meta-check.yml; result also goes to Telegram.
"""

from __future__ import annotations

import os
import sys

import httpx

from agent.config import DEFAULT_GRAPH_API_VERSION, redact
from agent.notify import telegram

NEEDED = {
    "pages_show_list", "pages_read_engagement", "pages_manage_posts", "pages_manage_engagement",
    "read_insights", "instagram_basic", "instagram_content_publish", "instagram_manage_comments",
    "instagram_manage_insights", "business_management", "ads_read", "ads_management",
}


def main() -> int:
    token = os.environ.get("META_ACCESS_TOKEN", "").strip()
    version = (os.environ.get("META_GRAPH_API_VERSION") or DEFAULT_GRAPH_API_VERSION).strip()
    if not token:
        print("META_ACCESS_TOKEN secret is not set.")
        return 1
    base = f"https://graph.facebook.com/{version}"
    lines: list[str] = []
    ok = True
    with httpx.Client(timeout=30, headers={"Authorization": f"Bearer {token}"}) as http:
        def get(path: str, **params) -> dict:
            r = http.get(f"{base}/{path}", params=params)
            body = r.json()
            if "error" in body:
                raise RuntimeError(redact(body["error"].get("message", str(body)), [token]))
            return body

        try:
            me = get("me", fields="id,name")
            lines.append(f"Robot user: {me.get('name')}")

            perms = {p["permission"] for p in get("me/permissions").get("data", []) if p.get("status") == "granted"}
            missing = sorted(NEEDED - perms)
            lines.append(f"Permissions granted: {len(NEEDED & perms)}/{len(NEEDED)}")
            if missing:
                ok = False
                lines.append("Missing: " + ", ".join(missing))

            pages = get("me/accounts", fields="id,name,instagram_business_account{id,username}").get("data", [])
            if not pages:
                ok = False
                lines.append("No Facebook Pages reachable - check the Page is assigned to the system user.")
            for p in pages:
                lines.append(f"Facebook Page: {p['name']} (id {p['id']})")
                ig = p.get("instagram_business_account")
                if ig:
                    lines.append(f"Instagram: @{ig.get('username')} (id {ig['id']})")
                else:
                    ok = False
                    lines.append("Instagram: not linked to this Page")
        except Exception as e:  # report, never crash with the token in the trace
            ok = False
            lines.append(f"Error: {redact(str(e), [token])}")

    report = ("✅ Meta connection OK (read-only test)\n\n" if ok else "⚠️ Meta connection needs attention\n\n") + "\n".join(lines)
    print(report)
    tg_token, tg_chat = os.environ.get("TELEGRAM_BOT_TOKEN", ""), os.environ.get("TELEGRAM_CHAT_ID", "")
    if tg_token and tg_chat:
        telegram.send_message(tg_token, tg_chat, report)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
