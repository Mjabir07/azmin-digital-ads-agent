import json
from datetime import date

import httpx

from agent.ads.fetch_insights import CONVERSATION_ACTION, MetaClient, date_ranges, parse_adset, parse_insight
from agent.config import Settings


def test_parse_insight_reads_conversations_and_numbers():
    raw = {
        "ad_id": "1", "ad_name": "Price-Carousel", "adset_id": "2", "adset_name": "Broad",
        "spend": "50.5", "impressions": "2000", "cpm": "25.25", "inline_link_click_ctr": "1.234",
        "frequency": "1.5", "actions": [{"action_type": "link_click", "value": "30"},
                                        {"action_type": CONVERSATION_ACTION, "value": "4"}],
    }
    row = parse_insight(raw, "ad", "last_7d")
    assert row.spend == 50.5 and row.impressions == 2000 and row.conversations == 4
    assert row.cost_per_conversation == 12.62
    assert row.link_ctr == 1.23
    assert row.id == "1" and row.name == "Price-Carousel"


def test_parse_insight_without_actions_has_zero_conversations():
    row = parse_insight({"ad_id": "1", "spend": "10"}, "ad", "yesterday")
    assert row.conversations == 0 and row.cost_per_conversation is None


def test_parse_adset_budget_is_converted_from_fils():
    a = parse_adset({"id": "9", "name": "x", "daily_budget": "3750", "start_time": "2026-10-01T09:00:00+0400"})
    assert a.daily_budget == 37.5 and a.start_time.year == 2026
    assert parse_adset({"id": "9"}).daily_budget is None


def test_date_ranges_are_yesterday_and_previous_seven_days():
    r = date_ranges(date(2026, 10, 15))
    assert r["yesterday"] == (date(2026, 10, 14), date(2026, 10, 14))
    assert r["last_7d"] == (date(2026, 10, 8), date(2026, 10, 14))


def _settings(**kw):
    base = dict(
        meta_graph_api_version="v24.0", meta_access_token="SECRET_TOKEN", meta_ad_account_id="act_123",
        meta_app_secret="", anthropic_api_key="", claude_model="m", telegram_bot_token="", telegram_chat_id="",
        google_service_account_json="", google_sheet_id="", dry_run=True, timezone=None,
    )
    base.update(kw)
    return Settings(**base)


def test_client_only_makes_get_requests_and_follows_paging():
    seen = []

    def handler(request: httpx.Request):
        seen.append(request)
        assert request.method == "GET"
        if "after" in request.url.params:
            return httpx.Response(200, json={"data": [{"id": "2"}]})
        return httpx.Response(200, json={
            "data": [{"id": "1"}],
            "paging": {"next": "https://graph.facebook.com/v24.0/act_123/adsets?after=abc&access_token=OLD"},
        })

    client = MetaClient(_settings(), http=httpx.Client(transport=httpx.MockTransport(handler)))
    assert client._get_all("act_123/adsets", {"fields": "id"}) == [{"id": "1"}, {"id": "2"}]
    assert seen[1].url.params["access_token"] == "SECRET_TOKEN"


def test_api_errors_never_contain_the_token():
    def handler(request):
        return httpx.Response(400, json={"error": {"message": "Invalid token SECRET_TOKEN"}})

    client = MetaClient(_settings(), http=httpx.Client(transport=httpx.MockTransport(handler)))
    try:
        client._get_all("act_123/insights", {})
    except RuntimeError as e:
        assert "SECRET_TOKEN" not in str(e) and "400" in str(e)
    else:
        raise AssertionError("expected an error")


def test_fetch_raw_requests_all_levels_and_windows():
    calls = []

    def handler(request):
        calls.append((request.url.path, request.url.params.get("level"), json.loads(request.url.params.get("time_range", "{}"))))
        return httpx.Response(200, json={"data": []})

    client = MetaClient(_settings(), http=httpx.Client(transport=httpx.MockTransport(handler)))
    raw = client.fetch_raw(date(2026, 10, 15))
    assert set(raw["insights"]) == {"yesterday", "last_7d"}
    levels = {c[1] for c in calls if c[0].endswith("/insights")}
    assert levels == {"campaign", "adset", "ad"}
    assert len(calls) == 7  # 2 windows x 3 levels + ad set list
