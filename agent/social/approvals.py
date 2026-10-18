"""Telegram approval flow for the content queue.

`python -m agent.social.approvals` sends every draft to Jabir's chat as a preview with
✅ Approve / ❌ Reject buttons. Button taps are picked up by agent.media.collect (the single
Telegram inbox reader), which calls handle_callback().
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

import httpx

from agent.config import ROOT
from agent.social import queue

TG_VIDEO_LIMIT = 50 * 1024 * 1024  # bots can upload up to 50 MB


def _preview(item: queue.Item) -> str:
    caption = (item.data.get("caption") or "(stories have no caption)").strip()
    head = f"🗓 {item.id} — {item.data.get('type', 'post')} for {', '.join(item.data.get('platforms', []))}\n⏰ Posts {queue.when(item)} after approval\n"
    if item.data.get("note"):
        head += f"📝 {item.data['note']}\n"
    head += "\n"
    room = 1024 - len(head) - 3  # Telegram media captions max 1024 chars
    return head + (caption if len(caption) <= room else caption[:room] + "…")


def keyboard(item_id: str) -> dict:
    return {"inline_keyboard": [[{"text": "✅ Approve", "callback_data": f"approve:{item_id}"},
                                 {"text": "❌ Reject", "callback_data": f"reject:{item_id}"}]]}


def _video_meta(path) -> dict:
    """Width/height/duration so Telegram shows the preview in the real 9:16 shape (it guesses otherwise)."""
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                              "-of", "json", str(path)], capture_output=True, text=True)
        info = json.loads(out.stdout)
        st = info["streams"][0]
        return {"width": st["width"], "height": st["height"], "duration": round(float(info["format"]["duration"]))}
    except (OSError, ValueError, KeyError, IndexError):
        return {"width": 1080, "height": 1920}  # our reels are always rendered 1080x1920


def send_drafts(token: str, chat_id: str) -> list[str]:
    sent = []
    base = f"https://api.telegram.org/bot{token}"
    with httpx.Client(timeout=300) as http:
        for item in queue.load_all():
            if item.status != "draft":
                continue
            if item.data.get("telegram_message_id"):  # re-sent draft: remove the old preview and its buttons
                http.post(f"{base}/deleteMessage", json={"chat_id": chat_id, "message_id": item.data["telegram_message_id"]})
            if item.data.get("type") == "ad_activate":  # ad campaign: text plan + Activate/Reject
                kb = {"inline_keyboard": [[{"text": "✅ Activate ads", "callback_data": f"approve:{item.id}"},
                                           {"text": "❌ Reject", "callback_data": f"reject:{item.id}"}]]}
                text = f"{item.data['caption']}\n\n💰 {item.data.get('note', '')}"
                resp = http.post(f"{base}/sendMessage", json={"chat_id": chat_id, "text": text[:4000], "reply_markup": kb}).json()
            elif item.data.get("type") == "carousel":
                # Albums can't carry buttons: send the slides, then a message with the caption + buttons.
                paths = [ROOT / f for f in item.data["images"]][:10]
                files = {f"s{i}": (p.name, p.read_bytes()) for i, p in enumerate(paths)}
                album = [{"type": "photo", "media": f"attach://s{i}"} for i in range(len(paths))]
                http.post(f"{base}/sendMediaGroup", data={"chat_id": chat_id, "media": json.dumps(album)}, files=files)
                resp = http.post(f"{base}/sendMessage", json={"chat_id": chat_id, "text": _preview(item),
                                                             "reply_markup": keyboard(item.id)}).json()
            else:
                is_video = item.data.get("type") == "reel"
                media = ROOT / item.data["video" if is_video else "image"]
                if media.stat().st_size > TG_VIDEO_LIMIT:
                    print(f"{item.id}: file over 50 MB, cannot preview in Telegram")
                    continue
                method, field_name = ("sendVideo", "video") if is_video else ("sendPhoto", "photo")
                data = {"chat_id": chat_id, "caption": _preview(item), "reply_markup": json.dumps(keyboard(item.id))}
                if is_video:
                    data |= {"supports_streaming": "true", **_video_meta(media)}
                with media.open("rb") as fh:
                    resp = http.post(f"{base}/{method}", data=data, files={field_name: (media.name, fh)}).json()
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
