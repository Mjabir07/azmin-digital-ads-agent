"""Telegram approval flow for the content queue.

`python -m agent.social.approvals` sends every draft to Jabir's chat as a preview with
✅ Approve / ❌ Reject buttons. Button taps are picked up by agent.media.collect (the single
Telegram inbox reader), which calls handle_callback().
"""

from __future__ import annotations

import json
import os
import sys

import httpx

from agent.config import ROOT
from agent.social import queue

TG_VIDEO_LIMIT = 50 * 1024 * 1024  # bots can upload up to 50 MB


def _preview(item: queue.Item) -> str:
    caption = item.data.get("caption", "").strip()
    head = f"🗓 {item.id} — {item.data.get('type', 'post')} for {', '.join(item.data.get('platforms', []))}\n⏰ Posts {queue.when(item)} after approval\n\n"
    room = 1024 - len(head) - 3  # Telegram media captions max 1024 chars
    return head + (caption if len(caption) <= room else caption[:room] + "…")


def keyboard(item_id: str) -> dict:
    return {"inline_keyboard": [[{"text": "✅ Approve", "callback_data": f"approve:{item_id}"},
                                 {"text": "❌ Reject", "callback_data": f"reject:{item_id}"}]]}


def send_drafts(token: str, chat_id: str) -> list[str]:
    sent = []
    base = f"https://api.telegram.org/bot{token}"
    with httpx.Client(timeout=300) as http:
        for item in queue.load_all():
            if item.status != "draft":
                continue
            media = ROOT / item.data["video" if item.data.get("type") == "reel" else "image"]
            if media.stat().st_size > TG_VIDEO_LIMIT:
                print(f"{item.id}: file over 50 MB, cannot preview in Telegram")
                continue
            method, field_name = ("sendVideo", "video") if item.data.get("type") == "reel" else ("sendPhoto", "photo")
            with media.open("rb") as fh:
                resp = http.post(f"{base}/{method}", data={
                    "chat_id": chat_id, "caption": _preview(item), "supports_streaming": "true",
                    "reply_markup": json.dumps(keyboard(item.id)),
                }, files={field_name: (media.name, fh)}).json()
            if not resp.get("ok"):
                print(f"{item.id}: Telegram error {resp.get('description')}")
                continue
            item.data["status"] = "pending"
            item.data["telegram_message_id"] = resp["result"]["message_id"]
            item.save()
            sent.append(item.id)
    return sent


def handle_callback(http: httpx.Client, base: str, cq: dict, chat_id: str) -> str | None:
    """Apply one button tap. Only taps from Jabir's own chat count. Returns a short log line."""
    msg = cq.get("message") or {}
    if str(msg.get("chat", {}).get("id")) != chat_id:
        return None
    action, _, item_id = (cq.get("data") or "").partition(":")
    item = queue.find(item_id)
    reply = "Not found"
    if item and action in ("approve", "reject") and item.status in ("pending", "draft"):
        item.data["status"] = "approved" if action == "approve" else "rejected"
        item.save()
        reply = f"✅ Approved — posts {queue.when(item)}" if action == "approve" else "❌ Rejected — not posted"
        http.post(f"{base}/editMessageReplyMarkup", json={"chat_id": chat_id, "message_id": msg.get("message_id"),
                                                          "reply_markup": {"inline_keyboard": [[{"text": reply, "callback_data": "noop"}]]}})
    elif item:
        reply = f"Already {item.status}"
    http.post(f"{base}/answerCallbackQuery", json={"callback_query_id": cq.get("id"), "text": reply})  # may be too old; harmless
    return f"{item_id}: {reply}"


def main() -> int:
    token, chat_id = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip(), os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        print("Telegram secrets missing.")
        return 1
    sent = send_drafts(token, chat_id)
    print("Sent for approval: " + (", ".join(sent) if sent else "nothing new"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
