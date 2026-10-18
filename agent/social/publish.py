"""Publish APPROVED queue items whose time has come to Instagram (Reels) and the Facebook Page.

Live posting only happens when config/publishing.yaml has `live: true` (or the PUBLISH_LIVE repo variable
is "true") and --dry-run is not given; otherwise it reports what it would post. Either way an item is only
posted after Jabir tapped ✅ Approve in Telegram. Videos are served to Meta from jsDelivr (public CDN mirror of
this public repo, correct video/mp4 type), pinned to the commit SHA.
"""

from __future__ import annotations

import argparse
import os
import sys
import time

import httpx
import yaml

from agent.config import DEFAULT_GRAPH_API_VERSION, ROOT
from agent.notify import telegram
from agent.social import queue


def media_url(rel_path: str) -> str:
    repo = os.environ.get("GITHUB_REPOSITORY", "Mjabir07/azmin-digital-ads-agent")
    ref = os.environ.get("GITHUB_SHA") or "main"
    return f"https://cdn.jsdelivr.net/gh/{repo}@{ref}/{rel_path}"


class Meta:
    def __init__(self, token: str, version: str):
        self.http = httpx.Client(base_url=f"https://graph.facebook.com/{version}/", timeout=120)
        self.token = token

    def call(self, method: str, path: str, token: str | None = None, **params) -> dict:
        resp = self.http.request(method, path, params={**params, "access_token": token or self.token})
        data = resp.json()
        if "error" in data:
            raise RuntimeError(f"Meta API error on {path.split('?')[0]}: {data['error'].get('message')}")
        return data

    def instagram_reel(self, ig_id: str, video: str, caption: str) -> str:
        box = self.call("POST", f"{ig_id}/media", media_type="REELS", video_url=video, caption=caption, share_to_feed="true")["id"]
        for _ in range(60):  # Meta downloads and processes the video; usually < 1 min
            status = self.call("GET", box, fields="status_code").get("status_code")
            if status == "FINISHED":
                break
            if status == "ERROR":
                raise RuntimeError("Instagram could not process the video")
            time.sleep(10)
        media_id = self.call("POST", f"{ig_id}/media_publish", creation_id=box)["id"]
        return self.call("GET", media_id, fields="permalink").get("permalink", media_id)

    def facebook_video(self, page_id: str, video: str, caption: str) -> str:
        page_token = self.call("GET", page_id, fields="access_token")["access_token"]
        vid = self.call("POST", f"{page_id}/videos", token=page_token, file_url=video, description=caption)["id"]
        return f"https://www.facebook.com/{page_id}/videos/{vid}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    cfg = yaml.safe_load((ROOT / "config/publishing.yaml").read_text()) or {}
    live = (cfg.get("live") is True or os.environ.get("PUBLISH_LIVE", "").lower() == "true") and not args.dry_run
    due = [i for i in queue.load_all() if i.due()]
    if not due:
        print("Nothing due.")
        return 0
    accounts = yaml.safe_load((ROOT / "config/accounts.yaml").read_text())["meta"]
    meta = Meta(os.environ.get("META_ACCESS_TOKEN", "").strip(),
                (os.environ.get("META_GRAPH_API_VERSION") or DEFAULT_GRAPH_API_VERSION).strip())
    lines = []
    for item in due:
        video = media_url(item.data["video"])
        caption = item.data["caption"].strip()
        if not live:
            lines.append(f"🧪 DRY RUN — would post {item.id} to {', '.join(item.data['platforms'])} now ({video})")
            continue
        posted, errors = dict(item.data.get("posted") or {}), []
        for platform in item.data["platforms"]:
            if platform in posted:
                continue
            try:
                if platform == "instagram":
                    posted[platform] = meta.instagram_reel(accounts["instagram_account_id"], video, caption)
                elif platform == "facebook":
                    posted[platform] = meta.facebook_video(accounts["facebook_page_id"], video, caption)
            except (RuntimeError, httpx.HTTPError) as e:
                errors.append(f"{platform}: {e}")
        item.data["posted"] = posted
        item.data["status"] = "failed" if errors and not posted else "posted"
        item.save()
        lines.append(f"✅ Posted {item.id}\n" + "\n".join(f"• {k}: {v}" for k, v in posted.items())
                     + ("\n⚠️ " + "; ".join(errors) if errors else ""))
    report = "\n\n".join(lines)
    print(report)
    tg_token, tg_chat = os.environ.get("TELEGRAM_BOT_TOKEN", ""), os.environ.get("TELEGRAM_CHAT_ID", "")
    if tg_token and tg_chat:
        telegram.send_message(tg_token, tg_chat, report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
