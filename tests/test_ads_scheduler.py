from datetime import datetime
from zoneinfo import ZoneInfo

from agent.ads import scheduler

DXB = ZoneInfo("Asia/Dubai")


def test_nothing_before_nine():
    assert scheduler.due(datetime(2026, 10, 20, 8, 59, tzinfo=DXB), {}) == []


def test_daily_at_nine_then_once():
    now = datetime(2026, 10, 20, 9, 5, tzinfo=DXB)
    assert [n for n, _ in scheduler.due(now, {})] == ["daily"]
    assert scheduler.due(now, {"daily": "2026-10-20"}) == []


def test_evening_pulse_after_daily_done():
    now = datetime(2026, 10, 20, 20, 1, tzinfo=DXB)
    assert [n for n, _ in scheduler.due(now, {"daily": "2026-10-20", "pulse_midday": "2026-10-20"})] == ["pulse_evening"]
