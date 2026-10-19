"""Runs the ads reports at fixed Dubai times. Called every 5 minutes by the publisher workflow
(started by the Cloudflare timer), so no extra schedule is needed.

09:00 → full daily report (agent.daily) · 14:00 and 20:00 → intraday pulse (agent.ads.pulse).
Each slot runs once per day; marketing/state/reports.yaml remembers what already ran.
"""

from __future__ import annotations

import subprocess
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

import yaml

from agent.config import ROOT

STATE = ROOT / "marketing/state/reports.yaml"
SLOTS = [("daily", 9, ["agent.daily", "--no-claude"]), ("pulse_midday", 14, ["agent.ads.pulse"]),
         ("pulse_evening", 20, ["agent.ads.pulse"])]


def due(now: datetime, state: dict) -> list[tuple[str, list[str]]]:
    today = now.date().isoformat()
    return [(name, mod) for name, hour, mod in SLOTS if now.hour >= hour and state.get(name) != today]


def main() -> int:
    now = datetime.now(ZoneInfo("Asia/Dubai"))
    state = yaml.safe_load(STATE.read_text()) if STATE.exists() else {}
    state = state or {}
    for name, mod in due(now, state)[-1:]:  # if several are overdue, only the latest runs
        print(f"Running {name}")
        subprocess.run([sys.executable, "-m", *mod], check=False)
        for n, hour, _ in SLOTS:  # mark this and any earlier missed slot as done for today
            if now.hour >= hour:
                state[n] = now.date().isoformat()
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(yaml.safe_dump(state, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
