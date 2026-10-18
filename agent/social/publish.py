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
    """Public URL Meta downloads from. Videos via jsDelivr (correct video/mp4 type); images via GitHub raw
    (image/jpeg, available the moment the commit exists). Pinned to the commit SHA."""
    repo = os.environ.get("GITHUB_REPOSITORY", "Mjabir07/azmin-digital-ads-agent")
    ref = os.environ.get("GITHUB_SHA") or "main"
    if rel_path.lower().endswith((".mp4", ".mov")):
        return f"https://cdn.jsdelivr.net/gh/{repo}@{ref}/{rel_path}"
    return f"https://raw.githubusercontent.com/{repo}/{ref}/{rel_path}"


def reachable(url: str, tries: int = 4) -> bool:
    """Make sure Meta will be able to download the file before asking it to."""
    for i in range(tries):
        try:
            r = httpx.head(url, timeout=30, follow_redirects=True)
            if r.status_code == 200 and r.headers.get("content-type", "").startswith(("image/", "video/")):
                return True
        except httpx.HTTPError:
            pass
        time.sleep(5 * (i + 1))
    return False


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

    def _ig_publish(self, ig_id: str, box: str) -> str:
        for _ in range(60):  # wait until Instagram has fetched/processed the media
            status = self.call("GET", box, fields="status_code").get("status_code")
            if status in ("FINISHED", None):
                break
            if status == "ERROR":
                raise RuntimeError("Instagram could not process the media")
            time.sleep(5)
        media_id = self.call("POST", f"{ig_id}/media_publish", creation_id=box)["id"]
        return self.call("GET", media_id, fields="permalink").get("permalink") or f"instagram media {media_id}"

    def instagram_image(self, ig_id: str, image: str, caption: str) -> str:
        return self._ig_publish(ig_id, self.call("POST", f"{ig_id}/media", image_url=image, caption=caption)["id"])

    def instagram_carousel(self, ig_id: str, images: list[str], caption: str) -> str:
        children = [self.call("POST", f"{ig_id}/media", image_url=u, is_carousel_item="true")["id"] for u in images]
        box = self.call("POST", f"{ig_id}/media", media_type="CAROUSEL", children=",".join(children), caption=caption)["id"]
        return self._ig_publish(ig_id, box)

    def instagram_story(self, ig_id: str, image: str) -> str:
        box = self.call("POST", f"{ig_id}/media", media_type="STORIES", image_url=image)["id"]
        self._ig_publish(ig_id, box)
        return "Instagram story (live for 24 h)"

    def _page_token(self, page_id: str) -> str:
        return self.call("GET", page_id, fields="access_token")["access_token"]

    def facebook_video(self, page_id: str, video: str, caption: str) -> str:
        vid = self.call("POST", f"{page_id}/videos", token=self._page_token(page_id), file_url=video, description=caption)["id"]
        return f"https://www.facebook.com/{page_id}/videos/{vid}"

    def facebook_photos(self, page_id: str, images: list[str], caption: str) -> str:
        token = self._page_token(page_id)
        if len(images) == 1:
            pid = self.call("POST", f"{page_id}/photos", token=token, url=images[0], caption=caption)
            return f"https://www.facebook.com/{pid.get('post_id', pid['id'])}"
        ids = [self.call("POST", f"{page_id}/photos", token=token, url=u, published="false")["id"] for u in images]
        params = {f"attached_media[{i}]": f'{{"media_fbid":"{m}"}}' for i, m in enumerate(ids)}
        post = self.call("POST", f"{page_id}/feed", token=token, message=caption, **params)["id"]
        return f"https://www.facebook.com/{post}"

    def facebook_story(self, page_id: str, image: str) -> str:
        token = self._page_token(page_id)
        photo = self.call("POST", f"{page_id}/photos", token=token, url=image, published="false")["id"]
        self.call("POST", f"{page_id}/photo_stories", token=token, photo_id=photo)
        return "Facebook story (live for 24 h)"


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
    ig, page = accounts["instagram_account_id"], accounts["facebook_page_id"]
    for item in due:
        kind = item.data.get("type", "reel")
        files = item.data.get("images") or [item.data.get("video") or item.data.get("image")]
        urls = [media_url(f) for f in files]
        caption = (item.data.get("caption") or "").strip()
        if not live:
            lines.append(f"🧪 DRY RUN — would post {kind} {item.id} to {', '.join(item.data['platforms'])} now ({urls[0]})")
            continue
        posted, errors = dict(item.data.get("posted") or {}), []
        bad = [u for u in urls if not reachable(u)]
        if bad:
            lines.append(f"⏳ {item.id}: media not downloadable yet ({bad[0]}) — will retry next run")
            continue
        for platform in item.data["platforms"]:
            if platform in posted:
                continue
            try:
                if platform == "instagram":
                    posted[platform] = (meta.instagram_reel(ig, urls[0], caption) if kind == "reel" else
                                        meta.instagram_carousel(ig, urls, caption) if kind == "carousel" else
                                        meta.instagram_story(ig, urls[0]) if kind == "story" else
                                        meta.instagram_image(ig, urls[0], caption))
                elif platform == "facebook":
                    posted[platform] = (meta.facebook_video(page, urls[0], caption) if kind == "reel" else
                                        meta.facebook_story(page, urls[0]) if kind == "story" else
                                        meta.facebook_photos(page, urls, caption))
            except (RuntimeError, httpx.HTTPError) as e:
                errors.append(f"{platform}: {e}")
        item.data["posted"] = posted
        item.data["status"] = "failed" if errors and not posted else "posted"
        item.save()
        head = f"✅ Posted {item.id}" if posted and not errors else f"⚠️ Partly posted {item.id}" if posted else f"❌ Failed {item.id}"
        lines.append(head + ("\n" if posted else "") + "\n".join(f"• {k}: {v}" for k, v in posted.items())
                     + ("\n⚠️ " + "; ".join(errors) if errors else ""))
    report = "\n\n".join(lines)
    print(report)
    tg_token, tg_chat = os.environ.get("TELEGRAM_BOT_TOKEN", ""), os.environ.get("TELEGRAM_CHAT_ID", "")
    if tg_token and tg_chat:
        telegram.send_message(tg_token, tg_chat, report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
