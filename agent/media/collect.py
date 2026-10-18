"""Collect videos/photos Jabir sends to the Telegram bot into media/inbox/.

The caption becomes the file name (e.g. "W00-S1" -> media/inbox/W00-S1.mp4).
Telegram bots can download files up to 20 MB (a Veo 8 s 720p clip is well under that).
Processed messages are confirmed so they are not collected twice.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

import httpx

from agent.config import ROOT
from agent.notify import telegram

INBOX = ROOT / "media/inbox"


def _safe(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]+", "-", name).strip("-")[:60] or "clip"


def main() -> int:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        print("Telegram secrets missing.")
        return 1
    base = f"https://api.telegram.org/bot{token}"
    saved, skipped, last_id = [], [], None
    with httpx.Client(timeout=120) as http:
        updates = http.get(f"{base}/getUpdates").json().get("result", [])
        kinds = [next((k for k in ("video", "document", "photo", "text") if k in (u.get("message") or {})), "/".join(u)) for u in updates]
        print(f"{len(updates)} update(s) waiting: {kinds}")  # diagnostics only, no message contents
        for u in updates:
            last_id = u["update_id"]
            msg = u.get("message") or {}
            if str(msg.get("chat", {}).get("id")) != chat_id:
                continue  # only accept files from Jabir's own chat
            media = msg.get("video") or msg.get("document") or (msg.get("photo") or [None])[-1]
            if not media:
                continue
            if media.get("file_size", 0) > 20 * 1024 * 1024:
                skipped.append(f"{msg.get('caption') or 'file'} (over 20 MB - send as a smaller file)")
                continue
            info = http.get(f"{base}/getFile", params={"file_id": media["file_id"]}).json()
            if not info.get("ok"):
                skipped.append(f"{msg.get('caption') or 'file'} ({info.get('description')})")
                continue
            path = info["result"]["file_path"]
            ext = Path(path).suffix or (".mp4" if "video" in msg or media.get("mime_type", "").startswith("video") else ".jpg")
            name = _safe(msg.get("caption") or Path(media.get("file_name", "clip")).stem or f"msg{msg['message_id']}")
            target = INBOX / f"{name}{ext}"
            if target.exists():
                target = INBOX / f"{name}-{msg['message_id']}{ext}"
            target.write_bytes(http.get(f"https://api.telegram.org/file/bot{token}/{path}").content)
            saved.append(target.name)
        if last_id is not None:
            http.get(f"{base}/getUpdates", params={"offset": last_id + 1})  # confirm processed messages
    report = "📥 Clip collector\n"
    report += ("Saved: " + ", ".join(saved)) if saved else "No new clips found."
    if skipped:
        report += "\nSkipped: " + "; ".join(skipped)
    print(report)
    telegram.send_message(token, chat_id, report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
