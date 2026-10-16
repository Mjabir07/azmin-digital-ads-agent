"""Made-up sample data (in Meta API format) for dry runs and tests."""

from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

from agent.ads.fetch_insights import Snapshot, build_snapshot, date_ranges

SAMPLE_FILE = Path(__file__).with_name("meta_sample.json")


def load_raw(today: date) -> dict:
    raw = json.loads(SAMPLE_FILE.read_text(encoding="utf-8"))
    for window, (since, until) in date_ranges(today).items():
        for rows in raw["insights"][window].values():
            for r in rows:
                r["date_start"], r["date_stop"] = since.isoformat(), until.isoformat()
    for a in raw["adsets"]:
        start = today - timedelta(days=a.pop("start_days_ago"))
        a["start_time"] = f"{start.isoformat()}T09:00:00+0400"
    return raw


def load_snapshot(today: date) -> Snapshot:
    return build_snapshot(today - timedelta(days=1), load_raw(today))
