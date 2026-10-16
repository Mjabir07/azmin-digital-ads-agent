"""Read-only pull of Meta ad insights (needs only the `ads_read` permission).

Fetches yesterday and the last 7 days at campaign, ad set and ad level, plus
basic ad set info (start time, daily budget) used by the rules engine.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from urllib.parse import parse_qsl, urlsplit, urlunsplit

import httpx

from agent.config import Settings, redact

GRAPH_URL = "https://graph.facebook.com"
LEVELS = ("campaign", "adset", "ad")
WINDOWS = ("yesterday", "last_7d")

# Meta's action type for "Messaging conversations started" (Click-to-WhatsApp).
CONVERSATION_ACTION = "onsite_conversion.messaging_conversation_started_7d"

INSIGHT_FIELDS = [
    "campaign_id",
    "campaign_name",
    "adset_id",
    "adset_name",
    "ad_id",
    "ad_name",
    "spend",
    "impressions",
    "cpm",
    "inline_link_click_ctr",
    "frequency",
    "actions",
]
ADSET_FIELDS = ["id", "name", "campaign_id", "effective_status", "daily_budget", "start_time", "created_time"]


@dataclass
class InsightRow:
    level: str
    window: str
    date_start: str
    date_stop: str
    campaign_id: str
    campaign_name: str
    adset_id: str
    adset_name: str
    ad_id: str
    ad_name: str
    spend: float
    impressions: int
    cpm: float
    link_ctr: float
    frequency: float
    conversations: int

    @property
    def id(self) -> str:
        return {"campaign": self.campaign_id, "adset": self.adset_id, "ad": self.ad_id}[self.level]

    @property
    def name(self) -> str:
        return {"campaign": self.campaign_name, "adset": self.adset_name, "ad": self.ad_name}[self.level]

    @property
    def cost_per_conversation(self) -> float | None:
        return round(self.spend / self.conversations, 2) if self.conversations else None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["cost_per_conversation"] = self.cost_per_conversation
        return d


@dataclass
class AdSetInfo:
    id: str
    name: str
    status: str
    daily_budget: float | None  # AED per day; None when the campaign uses a campaign budget
    start_time: datetime | None


@dataclass
class Snapshot:
    report_date: date  # "yesterday" in Dubai time
    rows: dict[str, dict[str, list[InsightRow]]]  # rows[window][level]
    adsets: dict[str, AdSetInfo]

    def get(self, window: str, level: str) -> list[InsightRow]:
        return self.rows.get(window, {}).get(level, [])


def _num(value, cast=float):
    try:
        return cast(float(value))
    except (TypeError, ValueError):
        return cast(0)


def parse_insight(raw: dict, level: str, window: str) -> InsightRow:
    conversations = 0
    for action in raw.get("actions") or []:
        if action.get("action_type") == CONVERSATION_ACTION:
            conversations = _num(action.get("value"), int)
    return InsightRow(
        level=level,
        window=window,
        date_start=raw.get("date_start", ""),
        date_stop=raw.get("date_stop", ""),
        campaign_id=raw.get("campaign_id", ""),
        campaign_name=raw.get("campaign_name", ""),
        adset_id=raw.get("adset_id", ""),
        adset_name=raw.get("adset_name", ""),
        ad_id=raw.get("ad_id", ""),
        ad_name=raw.get("ad_name", ""),
        spend=round(_num(raw.get("spend")), 2),
        impressions=_num(raw.get("impressions"), int),
        cpm=round(_num(raw.get("cpm")), 2),
        link_ctr=round(_num(raw.get("inline_link_click_ctr")), 2),
        frequency=round(_num(raw.get("frequency")), 2),
        conversations=conversations,
    )


def parse_adset(raw: dict) -> AdSetInfo:
    start = raw.get("start_time") or raw.get("created_time")
    budget = raw.get("daily_budget")
    return AdSetInfo(
        id=raw["id"],
        name=raw.get("name", ""),
        status=raw.get("effective_status", ""),
        # Meta returns budgets in the currency's minor unit (fils): 3750 = AED 37.50.
        daily_budget=round(int(budget) / 100, 2) if budget not in (None, "", "0") else None,
        start_time=datetime.strptime(start, "%Y-%m-%dT%H:%M:%S%z") if start else None,
    )


def date_ranges(today: date) -> dict[str, tuple[date, date]]:
    yesterday = today - timedelta(days=1)
    return {"yesterday": (yesterday, yesterday), "last_7d": (today - timedelta(days=7), yesterday)}


def build_snapshot(report_date: date, raw: dict) -> Snapshot:
    """raw = {"insights": {window: {level: [api rows]}}, "adsets": [api rows]}"""
    rows = {
        window: {level: [parse_insight(r, level, window) for r in raw["insights"].get(window, {}).get(level, [])] for level in LEVELS}
        for window in WINDOWS
    }
    adsets = {a.id: a for a in (parse_adset(r) for r in raw.get("adsets", []))}
    return Snapshot(report_date=report_date, rows=rows, adsets=adsets)


class MetaClient:
    """Minimal read-only Graph API client. Only GET requests - it cannot change ads."""

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        if not settings.meta_access_token or not settings.meta_ad_account_id:
            raise RuntimeError("META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set")
        if not settings.meta_ad_account_id.startswith("act_"):
            raise RuntimeError("META_AD_ACCOUNT_ID must look like act_1234567890")
        self.settings = settings
        self.base = f"{GRAPH_URL}/{settings.meta_graph_api_version}"
        self.http = http or httpx.Client(timeout=60)

    def _auth_params(self) -> dict:
        params = {"access_token": self.settings.meta_access_token}
        if self.settings.meta_app_secret:
            params["appsecret_proof"] = hmac.new(
                self.settings.meta_app_secret.encode(), self.settings.meta_access_token.encode(), hashlib.sha256
            ).hexdigest()
        return params

    def _get_all(self, path: str, params: dict) -> list[dict]:
        url, query = f"{self.base}/{path}", {**params, **self._auth_params()}
        out: list[dict] = []
        while url:
            try:
                resp = self.http.get(url, params=query)
            except httpx.HTTPError as e:
                raise RuntimeError(redact(f"Meta API network error: {e}", self.settings.secrets())) from None
            if resp.status_code != 200:
                try:
                    msg = resp.json().get("error", {}).get("message", resp.text)
                except ValueError:
                    msg = resp.text
                raise RuntimeError(redact(f"Meta API error {resp.status_code}: {msg}", self.settings.secrets()))
            body = resp.json()
            out.extend(body.get("data", []))
            next_url = body.get("paging", {}).get("next")
            if not next_url:
                break
            # The "next" link embeds our token; strip it and send the auth params ourselves.
            parts = urlsplit(next_url)
            query = {k: v for k, v in parse_qsl(parts.query) if k not in ("access_token", "appsecret_proof")}
            query.update(self._auth_params())
            url = urlunsplit(parts._replace(query=""))
        return out

    def fetch_raw(self, today: date) -> dict:
        account = self.settings.meta_ad_account_id
        insights: dict[str, dict[str, list[dict]]] = {}
        for window, (since, until) in date_ranges(today).items():
            insights[window] = {}
            for level in LEVELS:
                insights[window][level] = self._get_all(
                    f"{account}/insights",
                    {
                        "level": level,
                        "fields": ",".join(INSIGHT_FIELDS),
                        "time_range": json.dumps({"since": since.isoformat(), "until": until.isoformat()}),
                        "limit": 500,
                    },
                )
        adsets = self._get_all(f"{account}/adsets", {"fields": ",".join(ADSET_FIELDS), "limit": 200})
        return {"insights": insights, "adsets": adsets}


def fetch_snapshot(settings: Settings, today: date) -> Snapshot:
    raw = MetaClient(settings).fetch_raw(today)
    return build_snapshot(today - timedelta(days=1), raw)
