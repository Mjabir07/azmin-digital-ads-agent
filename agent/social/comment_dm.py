"""Comment keyword -> free guide by DM (config/comment-dm.yaml).

Run every 5 minutes by the publisher. Reads new comments on our Instagram posts from the last few days and,
for comments that contain a keyword (e.g. "SKILL"):
  - mode alert: tells Jabir in Telegram who asked, with the guide link and the DM text to send by hand;
  - mode auto:  sends the fixed DM as an Instagram private reply and answers the comment publicly
                ("Sent! Check your DMs"); if Meta refuses, it falls back to the Telegram alert.
Follow gate (follow_gate: true): the first DM asks them to follow and reply DONE; on their reply the agent checks
the follow and sends the guide, or a nudge.
--dry-run only reports. marketing/state/comment-dm.yaml remembers handled comment IDs and, while someone is in
the follow step, their Instagram-scoped ID (no names or numbers), for at most 7 days.
Never fails the publisher: errors are reported to Telegram once and the run ends cleanly.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
from datetime import UTC, datetime, timedelta

import yaml

from agent.config import DEFAULT_GRAPH_API_VERSION, ROOT, redact
from agent.notify import telegram
from agent.social.publish import Meta

CONFIG = ROOT / "config/comment-dm.yaml"
STATE = ROOT / "marketing/state/comment-dm.yaml"
KEEP_DAYS = 30
REPO = "Mjabir07/azmin-digital-ads-agent"


def guide_link(path: str) -> str:
    return f"https://cdn.jsdelivr.net/gh/{REPO}@main/{path}"


def match_keyword(text: str, keywords: dict) -> str | None:
    """Keyword whose words appear as a whole word in the comment (case-insensitive), else None."""
    words = set(re.findall(r"[a-z0-9]+", (text or "").lower()))
    for name, kw in keywords.items():
        if words & {m.lower() for m in kw.get("match", [name])}:
            return name
    return None


def load_state() -> dict:
    state = yaml.safe_load(STATE.read_text()) if STATE.exists() else None
    return state or {"done": {}}


def save_state(state: dict, today: str) -> None:
    cutoff = (datetime.fromisoformat(today) - timedelta(days=KEEP_DAYS)).date().isoformat()
    state["done"] = {k: v for k, v in state["done"].items() if v.split()[0] >= cutoff}
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(yaml.safe_dump(state, sort_keys=True, allow_unicode=True))


def new_comments(meta: Meta, ig_id: str, own: str, since: datetime, done: dict) -> list[dict]:
    """Top-level comments on our recent posts that we haven't handled yet, oldest first."""
    media = meta.call("GET", f"{ig_id}/media", fields="id,timestamp,permalink", limit=15).get("data", [])
    out = []
    for m in media:
        if datetime.fromisoformat(m["timestamp"].replace("+0000", "+00:00")) < since:
            continue
        after = None
        for _ in range(10):  # up to 500 comments per post per run
            params = {"fields": "id,text,username,timestamp", "limit": 50} | ({"after": after} if after else {})
            page = meta.call("GET", f"{m['id']}/comments", **params)
            for c in page.get("data", []):
                if c["id"] not in done and c.get("username", "").lower() != own.lower():
                    out.append(c | {"permalink": m.get("permalink", "")})
            after = page.get("paging", {}).get("cursors", {}).get("after") if page.get("paging", {}).get("next") else None
            if not after:
                break
    return sorted(out, key=lambda c: c.get("timestamp", ""))


def send_dm(meta: Meta, ig_id: str, page_id: str, text: str, comment_id: str | None = None,
            user_id: str | None = None) -> str:
    """DM via the Page token. comment_id = private reply to a comment (one per comment, Meta's rule);
    user_id = a normal reply to someone who has messaged us. Returns the person's Instagram-scoped ID."""
    recipient = {"comment_id": comment_id} if comment_id else {"id": user_id}
    resp = meta.call("POST", f"{ig_id}/messages", token=meta._page_token(page_id),
                     recipient=json.dumps(recipient), message=json.dumps({"text": text}))
    return resp.get("recipient_id", user_id or "")


def follows_us(meta: Meta, page_id: str, user_id: str) -> bool | None:
    """True/False from Instagram, None if Meta won't say (then we don't hold the guide back)."""
    try:
        info = meta.call("GET", user_id, token=meta._page_token(page_id), fields="is_user_follow_business")
    except RuntimeError as e:
        print(f"Follow check failed: {e}")
        return None
    return info.get("is_user_follow_business")


def new_replies(meta: Meta, page_id: str, user_id: str, after: str) -> list[dict]:
    """Messages this person sent us after `after` (ISO time), oldest first."""
    convs = meta.call("GET", f"{page_id}/conversations", token=meta._page_token(page_id), platform="instagram",
                      user_id=user_id, fields="messages.limit(10){id,created_time,from}").get("data", [])
    msgs = [m for c in convs for m in c.get("messages", {}).get("data", [])]
    return sorted((m for m in msgs if m.get("from", {}).get("id") == user_id and m["created_time"] > after),
                  key=lambda m: m["created_time"])


def follow_ups(meta: Meta, cfg: dict, accounts: dict, state: dict, now: datetime) -> tuple[list[str], list[str]]:
    """Follow gate: people who got the 'follow + reply DONE' DM. When they reply, check the follow and send
    the guide, or a nudge (max `max_nudges`, then Jabir takes over). Returns (sent keywords, Telegram lines)."""
    ig, page = accounts["instagram_account_id"], accounts["facebook_page_id"]
    waiting = state.setdefault("waiting", {})
    sent, lines = [], []
    for uid, w in list(waiting.items()):
        if w["since"] < (now - timedelta(days=cfg.get("lookback_days", 7))).isoformat():
            del waiting[uid]
            continue
        try:
            replies = new_replies(meta, page, uid, w["after"])
        except RuntimeError as e:  # try again next run
            print(f"Reading DM replies failed: {e}")
            continue
        if not replies:
            continue
        w["after"] = replies[-1]["created_time"]
        k = cfg["keywords"][w["kw"]]
        try:
            if follows_us(meta, page, uid) is not False:
                send_dm(meta, ig, page, cfg["dm_text"].format(title=k["title"], link=guide_link(k["guide"])), user_id=uid)
                del waiting[uid]
                sent.append(w["kw"])
                continue
            if w["nudges"] < cfg.get("max_nudges", 2):
                send_dm(meta, ig, page, cfg["not_following_text"], user_id=uid)
                w["nudges"] += 1
                continue
        except RuntimeError as e:
            lines.append(f"⚠️ Couldn't answer a {w['kw']} DM reply ({e}): please check Instagram DMs.")
            del waiting[uid]
            continue
        del waiting[uid]
        lines.append(f"🙋 Someone asked for the {w['kw']} guide {w['nudges'] + 1}× without following: "
                     "answer them in Instagram DMs if you like.")
    return sent, lines


def run(meta: Meta, cfg: dict, accounts: dict, state: dict, now: datetime, live: bool) -> list[str]:
    """Handle new keyword comments. Returns lines for Jabir's Telegram (empty = nothing to say)."""
    ig, page, own = accounts["instagram_account_id"], accounts["facebook_page_id"], accounts.get("instagram_username", "")
    today = now.date().isoformat()
    since = now - timedelta(days=cfg.get("lookback_days", 7))
    comments = new_comments(meta, ig, own, since, state["done"])
    auto = cfg.get("mode") == "auto"
    sent, asked, manual = [], [], []
    if live and auto:
        sent, gate_lines = follow_ups(meta, cfg, accounts, state, now)
    else:
        gate_lines = []
    for c in comments:
        kw = match_keyword(c.get("text", ""), cfg["keywords"])
        if not kw:
            state["done"][c["id"]] = f"{today} no-keyword"
            continue
        if len(asked) + len(sent) + len(manual) >= cfg.get("max_per_run", 25):
            break  # the rest wait for the next run (not marked done)
        k = cfg["keywords"][kw]
        dm = cfg["dm_text"].format(title=k["title"], link=guide_link(k["guide"]))
        if not live:
            manual.append((c, kw, dm, "dry run"))
            continue
        if auto:
            gate = cfg.get("follow_gate", False)
            try:
                uid = send_dm(meta, ig, page, cfg["gate_text"].format(title=k["title"]) if gate else dm, comment_id=c["id"])
                state["done"][c["id"]] = f"{today} {'asked-follow' if gate else 'sent'} {kw}"
                if gate and uid:
                    state.setdefault("waiting", {})[uid] = {"kw": kw, "since": now.isoformat(),
                                                            "after": c.get("timestamp", ""), "nudges": 0}
                    asked.append(kw)
                else:
                    sent.append(kw)
            except RuntimeError as e:
                manual.append((c, kw, dm, str(e)))
                state["done"][c["id"]] = f"{today} alerted {kw}"
                continue
            try:
                meta.call("POST", f"{c['id']}/replies", message=random.choice(cfg["public_replies"]))
            except RuntimeError as e:
                print(f"Public reply failed (DM was sent): {e}")
        else:
            manual.append((c, kw, dm, ""))
            state["done"][c["id"]] = f"{today} alerted {kw}"

    def tally(kws: list[str]) -> str:
        return ", ".join(f"{kws.count(k)}× {k}" for k in dict.fromkeys(kws))

    lines = []
    if asked:
        lines.append("👋 Asked to follow + reply DONE: " + tally(asked))
    if sent:
        lines.append("📩 Guide sent by DM: " + tally(sent))
    lines += gate_lines
    if manual:
        lines.append("💬 Send these people the guide by DM (Instagram → the comment → Reply privately):")
        for c, kw, _, why in manual:
            note = f" (auto DM failed: {why})" if why and why != "dry run" else ""
            lines.append(f"• @{c.get('username', '?')}: \"{c.get('text', '')[:80]}\" → {kw}{note}\n  {c['permalink']}")
        kw_dms = {kw: dm for _, kw, dm, _ in manual}
        for kw, dm in kw_dms.items():
            lines.append(f"\nDM text for {kw} (copy):\n{dm}")
    return lines


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    cfg = yaml.safe_load(CONFIG.read_text())
    accounts = yaml.safe_load((ROOT / "config/accounts.yaml").read_text())["meta"]
    token = os.environ.get("META_ACCESS_TOKEN", "").strip()
    tg_token, tg_chat = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip(), os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token:
        print("META_ACCESS_TOKEN not set; skipping comment check.")
        return 0
    meta = Meta(token, (os.environ.get("META_GRAPH_API_VERSION") or DEFAULT_GRAPH_API_VERSION).strip())
    now = datetime.now(UTC)
    state = load_state()
    try:
        lines = run(meta, cfg, accounts, state, now, live=not args.dry_run)
        state.pop("last_error", None)
    except Exception as e:  # noqa: BLE001 - report once, never break the publisher
        err = redact(str(e), [token])
        print(f"Comment check failed: {err}")
        lines = [] if state.get("last_error") == err else [f"⚠️ Comment → DM check failed: {err}"]
        state["last_error"] = err
    print("\n".join(lines) or "No new keyword comments.")
    if args.dry_run:
        return 0
    save_state(state, now.date().isoformat())
    if lines and tg_token and tg_chat:
        try:
            telegram.send_message(tg_token, tg_chat, "\n".join(lines))
        except RuntimeError as e:
            print(e)
    return 0


if __name__ == "__main__":
    sys.exit(main())
