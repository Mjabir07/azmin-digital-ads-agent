"""Point the Telegram bot at the Cloudflare worker (instant replies), or switch back to polling.

    python -m agent.notify.telegram_webhook set     # needs TELEGRAM_WEBHOOK_URL + TELEGRAM_WEBHOOK_SECRET
    python -m agent.notify.telegram_webhook delete  # back to 5-minute polling
"""

from __future__ import annotations

import os
import sys

import httpx

from agent.notify import telegram


def main() -> int:
    token = os.environ["TELEGRAM_BOT_TOKEN"].strip()
    base = f"https://api.telegram.org/bot{token}"
    mode = sys.argv[1] if len(sys.argv) > 1 else "set"
    with httpx.Client(timeout=30) as http:
        if mode == "delete":
            result = http.post(f"{base}/deleteWebhook").json()
        else:
            url, secret = os.environ["TELEGRAM_WEBHOOK_URL"].strip(), os.environ["TELEGRAM_WEBHOOK_SECRET"].strip()
            result = http.post(f"{base}/setWebhook", json={"url": url, "secret_token": secret,
                                                           "allowed_updates": ["message", "callback_query"]}).json()
        info = http.get(f"{base}/getWebhookInfo").json().get("result", {})
    ok = result.get("ok")
    report = (f"⚡ Instant replies {'ON' if mode != 'delete' else 'OFF'}: {'done' if ok else 'failed — ' + str(result.get('description'))}\n"
              f"Webhook: {info.get('url') or '(none — polling every 5 min)'}\n"
              f"Waiting updates: {info.get('pending_update_count', 0)}"
              + (f"\nLast error: {info['last_error_message']}" if info.get("last_error_message") else ""))
    print(report)
    telegram.send_message(token, os.environ["TELEGRAM_CHAT_ID"].strip(), report)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
