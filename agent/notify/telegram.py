"""Send the report to Jabir's Telegram chat."""

from __future__ import annotations

import httpx

MAX_LEN = 4000  # Telegram's limit is 4096 characters per message


def _chunks(text: str) -> list[str]:
    parts, current = [], ""
    for line in text.splitlines(keepends=True):
        if len(current) + len(line) > MAX_LEN and current:
            parts.append(current)
            current = ""
        current += line
    if current:
        parts.append(current)
    return parts


def send_message(token: str, chat_id: str, text: str) -> None:
    if not token or not chat_id:
        raise RuntimeError("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set")
    with httpx.Client(timeout=30) as http:
        for part in _chunks(text):
            try:
                resp = http.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": chat_id, "text": part, "disable_web_page_preview": True},
                )
            except httpx.HTTPError as e:
                # Don't include the URL: it contains the bot token.
                raise RuntimeError(f"Telegram network error: {type(e).__name__}") from None
            if resp.status_code != 200:
                try:
                    desc = resp.json().get("description", "")
                except ValueError:
                    desc = ""
                raise RuntimeError(f"Telegram error {resp.status_code}: {desc}")
