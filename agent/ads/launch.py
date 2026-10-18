"""Build a Click-to-WhatsApp campaign from a spec — PAUSED — and queue it for Jabir's approval.

    uv run python -m agent.ads.launch marketing/ads/<spec>.yaml            # dry run: validate + print plan
    uv run python -m agent.ads.launch marketing/ads/<spec>.yaml --resolve  # + look up targeting IDs (read-only)
    uv run python -m agent.ads.launch marketing/ads/<spec>.yaml --build    # create everything PAUSED (no spend)

--build writes marketing/ads/<spec>.built.yaml and a queue item of type "ad_activate". Only Jabir's ✅ in
Telegram makes the publisher set the campaign ACTIVE. Budgets are checked against config/limits.yaml
both here and again right before activation (CLAUDE.md hard rules 1–4).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import httpx
import yaml

from agent.config import DEFAULT_GRAPH_API_VERSION, ROOT
from agent.social import queue
from agent.social.publish import media_url, reachable

LIMITS = yaml.safe_load((ROOT / "config/limits.yaml").read_text())
ACCOUNTS = yaml.safe_load((ROOT / "config/accounts.yaml").read_text())["meta"]


class LimitError(ValueError):
    pass


def check_limits(spec: dict) -> float:
    """Raise if any ad set or the account total would exceed config/limits.yaml. Returns total AED/day."""
    total = 0.0
    for a in spec["adsets"]:
        b = float(a["daily_budget_aed"])
        if b <= 0 or b > LIMITS["adset_daily_budget_max"]:
            raise LimitError(f"Ad set '{a['name']}' budget AED {b} is outside 0–{LIMITS['adset_daily_budget_max']}")
        total += b
    if total > LIMITS["account_daily_budget_max"]:
        raise LimitError(f"Total AED {total}/day is above the account limit AED {LIMITS['account_daily_budget_max']}")
    return total


class Graph:
    def __init__(self, token: str, version: str):
        self.http = httpx.Client(base_url=f"https://graph.facebook.com/{version}/", timeout=120)
        self.token = token

    def call(self, method: str, path: str, **params) -> dict:
        data = {k: (json.dumps(v) if isinstance(v, (dict, list)) else v) for k, v in params.items()}
        resp = self.http.request(method, path, params={"access_token": self.token, **(data if method == "GET" else {})},
                                 data=None if method == "GET" else data)
        body = resp.json()
        if "error" in body:
            err = body["error"]
            raise RuntimeError(f"Meta API error on {path}: {err.get('error_user_msg') or err.get('message')}")
        return body


def resolve(g: Graph, spec: dict) -> dict:
    """Look up IDs for cities, locales, interests and behaviours (read-only search calls)."""
    base, sig = spec["targeting_base"], spec["owner_signals"]
    cities = []
    for name in base["cities"]:
        hits = g.call("GET", "search", type="adgeolocation", location_types=["city"], q=name, country_code="AE").get("data", [])
        if hits:
            cities.append({"key": hits[0]["key"], "name": hits[0]["name"]})
    locales = []
    for name in base["locales"]:
        hits = g.call("GET", "search", type="adlocale", q=name.split(" (")[0]).get("data", [])
        match = next((h for h in hits if h["name"] == name), hits[0] if hits else None)
        if match:
            locales.append({"key": match["key"], "name": match["name"]})
    interests = []
    for name in sig["interests"]:
        hits = g.call("GET", "search", type="adinterest", q=name, limit=5).get("data", [])
        match = next((h for h in hits if h["name"].lower() == name.lower()), hits[0] if hits else None)
        if match:
            interests.append({"id": match["id"], "name": match["name"]})
    all_beh = g.call("GET", "search", type="adTargetingCategory", **{"class": "behaviors"}).get("data", [])
    behaviors = [{"id": b["id"], "name": b["name"]} for want in sig["behaviors"]
                 for b in all_beh if b["name"].lower() == want.lower()][: len(sig["behaviors"])]
    return {"cities": cities, "locales": locales, "interests": interests, "behaviors": behaviors}


def targeting(spec: dict, ids: dict, advantage: bool) -> dict:
    base = spec["targeting_base"]
    t = {
        "geo_locations": {"cities": [{"key": c["key"]} for c in ids["cities"]], "location_types": base["location_types"]},
        "age_min": base["age_min"], "age_max": base["age_max"],
        "locales": [l["key"] for l in ids["locales"]],
        "flexible_spec": [{"interests": [{"id": i["id"]} for i in ids["interests"]],
                           "behaviors": [{"id": b["id"]} for b in ids["behaviors"]]}],
        "targeting_automation": {"advantage_audience": 1 if advantage else 0},
        **base["placements"],
    }
    return t


def welcome(prefill: str) -> str:
    return json.dumps({"type": "VISUAL_EDITOR", "version": 2, "landing_screen_type": "welcome_message", "media_type": "text",
                       "text_format": {"customer_action_type": "autofill_message",
                                       "message": {"autofill_message": {"content": prefill}, "text": "Hi! 👋 How can we help your business?"}}})


def plan_text(spec: dict, ids: dict | None, total: float) -> str:
    lines = [f"📣 Ad plan: {spec['campaign']['name']}", f"Objective: WhatsApp conversations · Total AED {total:g}/day",
             f"Where: {', '.join(spec['targeting_base']['cities'])} (people living there) · Age {spec['targeting_base']['age_min']}–{spec['targeting_base']['age_max']}",
             "Placements: Facebook + Instagram feed, stories, reels (no Audience Network)"]
    for a in spec["adsets"]:
        lines.append(f"• {a['name']}: AED {a['daily_budget_aed']:g}/day · {'Advantage+ with owner hints' if a['advantage_audience'] else 'business-owner signals only'}")
    if ids:
        lines.append("Owner signals: " + ", ".join(x["name"] for x in ids["behaviors"] + ids["interests"]))
    lines.append("Ads: " + ", ".join(ad["name"] for ad in spec["ads"]))
    lines.append(f"Pre-filled WhatsApp message: \"{spec['prefill_message']}\"")
    return "\n".join(lines)


def build(g: Graph, spec: dict, ids: dict, act: str) -> dict:
    page, ig = ACCOUNTS["facebook_page_id"], ACCOUNTS["instagram_account_id"]
    cta = {"type": "WHATSAPP_MESSAGE", "value": {"app_destination": "WHATSAPP"}}
    camp = g.call("POST", f"{act}/campaigns", name=spec["campaign"]["name"], objective=spec["campaign"]["objective"],
                  status="PAUSED", special_ad_categories=[], is_adset_budget_sharing_enabled="false")["id"]
    built = {"campaign_id": camp, "adsets": [], "ads": []}
    creatives = []
    for ad in spec["ads"]:
        if ad.get("video"):
            url = media_url(ad["video"])
            if not reachable(url):
                raise RuntimeError(f"Video not downloadable: {url}")
            vid = g.call("POST", f"{act}/advideos", file_url=url, name=ad["name"])["id"]
            for _ in range(60):
                st = g.call("GET", vid, fields="status,picture")
                if st.get("status", {}).get("video_status") == "ready":
                    break
                time.sleep(10)
            story = {"page_id": page, "instagram_user_id": ig, "video_data": {
                "video_id": vid, "image_url": st.get("picture"), "message": ad["primary_text"], "title": ad["headline"],
                "call_to_action": cta, "page_welcome_message": welcome(spec["prefill_message"])}}
        else:
            files = ad.get("images") or [ad["image"]]
            hashes = []
            for f in files:
                img = g.call("POST", f"{act}/adimages", url=media_url(f))
                hashes.append(next(iter(img["images"].values()))["hash"])
            link = {"link": "https://api.whatsapp.com/send", "message": ad["primary_text"], "name": ad["headline"],
                    "call_to_action": cta, "page_welcome_message": welcome(spec["prefill_message"])}
            if len(hashes) == 1:
                link["image_hash"] = hashes[0]
            else:
                link["child_attachments"] = [{"image_hash": h, "link": "https://api.whatsapp.com/send", "name": ad["headline"],
                                              "call_to_action": cta} for h in hashes]
            story = {"page_id": page, "instagram_user_id": ig, "link_data": link}
        cr = g.call("POST", f"{act}/adcreatives", name=ad["name"], object_story_spec=story)["id"]
        creatives.append((ad["name"], cr))
    for a in spec["adsets"]:
        aset = g.call("POST", f"{act}/adsets", name=a["name"], campaign_id=camp, status="PAUSED",
                      daily_budget=int(round(float(a["daily_budget_aed"]) * 100)), billing_event="IMPRESSIONS",
                      optimization_goal="CONVERSATIONS", destination_type="WHATSAPP", bid_strategy="LOWEST_COST_WITHOUT_CAP",
                      promoted_object={"page_id": page}, targeting=targeting(spec, ids, a["advantage_audience"]))["id"]
        built["adsets"].append({"name": a["name"], "id": aset})
        for name, cr in creatives:
            ad_id = g.call("POST", f"{act}/ads", name=name, adset_id=aset, creative={"creative_id": cr}, status="PAUSED")["id"]
            built["ads"].append({"name": f"{a['name']} / {name}", "id": ad_id})
    return built


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--resolve", action="store_true")
    ap.add_argument("--build", action="store_true")
    args = ap.parse_args()
    spec_path = Path(args.spec).resolve()
    spec = yaml.safe_load(spec_path.read_text())
    total = check_limits(spec)
    ids = None
    if args.resolve or args.build:
        g = Graph(os.environ["META_ACCESS_TOKEN"].strip(), (os.environ.get("META_GRAPH_API_VERSION") or DEFAULT_GRAPH_API_VERSION).strip())
        ids = resolve(g, spec)
    print(plan_text(spec, ids, total))
    if not args.build:
        print("\n(dry run — nothing created)")
        return 0
    act = os.environ.get("META_AD_ACCOUNT_ID", "").strip()
    if not act.startswith("act_"):
        raise SystemExit("META_AD_ACCOUNT_ID (act_...) is not set")
    built = build(g, spec, ids, act)
    out = spec_path.with_suffix(".built.yaml")
    out.write_text(yaml.safe_dump({"ad_account": act, **built}, sort_keys=False))
    item = queue.Item(queue.QUEUE / f"ad-{spec_path.stem}.yaml", {
        "id": f"ad-{spec_path.stem}", "type": "ad_activate", "built": str(out.relative_to(ROOT)),
        "platforms": ["meta-ads"], "post_at": time.strftime("%Y-%m-%d %H:%M", time.gmtime(time.time() + 4 * 3600)),
        "note": "Approving makes the campaign ACTIVE and starts spending. Learning phase: no edits for 72 h.",
        "caption": plan_text(spec, ids, total), "status": "draft"})
    item.save()
    print(f"\nBuilt PAUSED. IDs: {out.relative_to(ROOT)} · approval queued: {item.path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
