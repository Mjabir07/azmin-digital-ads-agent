"""One-time helper: find the chat that messaged the bot and send it its chat ID.

Run by .github/workflows/telegram-setup.yml (needs only the TELEGRAM_BOT_TOKEN secret).
The token is never printed.
"""

from __future__ import annotations

import os
import sys

import httpx


def main() -> int:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        print("TELEGRAM_BOT_TOKEN secret is not set yet.")
        return 1
    base = f"https://api.telegram.org/bot{token}"
    with httpx.Client(timeout=30) as http:
        me = http.get(f"{base}/getMe").json()
        if not me.get("ok"):
            print("Token rejected by Telegram - check the TELEGRAM_BOT_TOKEN secret.")
            return 1
        print(f"Bot: @{me['result']['username']}")
        hook = http.get(f"{base}/getWebhookInfo").json().get("result", {})
        if hook.get("url"):
            print("A webhook is set on this bot, so messages are not kept for us. Removing it.")
            http.post(f"{base}/deleteWebhook")
        resp = http.get(f"{base}/getUpdates").json()
        if not resp.get("ok"):
            print(f"Telegram error: {resp.get('description')}")
            return 1
        updates = resp.get("result", [])
        print(f"Messages waiting: {len(updates)}")
        chats = {}
        for u in updates:
            msg = u.get("message") or u.get("edited_message") or {}
            chat = msg.get("chat") or {}
            if chat.get("type") == "private":
                chats[chat["id"]] = chat.get("first_name", "")
        if not chats:
            print("No private messages found. Send 'hi' to the bot, then run this again.")
            return 1
        for chat_id, name in chats.items():
            http.post(f"{base}/sendMessage", json={
                "chat_id": chat_id,
                "text": (f"✅ Connected, {name}!\n\nYour TELEGRAM_CHAT_ID is:\n{chat_id}\n\n"
                         "Add it on GitHub: Settings → Secrets and variables → Actions → "
                         "New repository secret → Name: TELEGRAM_CHAT_ID"),
            })
            print(f"Sent chat ID to {name or 'chat'} (id ends ...{str(chat_id)[-3:]})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
