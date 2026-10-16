"""Write metrics and recommendations to Jabir's Google Sheet.

Tabs: `metrics` (one row per campaign / ad set / ad per window) and `actions_log`
(every recommendation, marked "recommended" - nothing is changed in Phase 1).
"""

from __future__ import annotations

import json
from datetime import datetime

from agent.ads.fetch_insights import Snapshot
from agent.rules.engine import Recommendation

METRICS_HEADER = [
    "report_date", "window", "date_start", "date_stop", "level",
    "campaign", "ad_set", "ad", "id",
    "spend_aed", "impressions", "cpm_aed", "link_ctr_pct", "frequency",
    "conversations", "cost_per_conversation_aed",
]
ACTIONS_HEADER = [
    "logged_at", "report_date", "type", "level", "name", "id", "action", "reason", "status",
]


def metrics_rows(snapshot: Snapshot) -> list[list]:
    rows = []
    for window, levels in snapshot.rows.items():
        for level, items in levels.items():
            for r in items:
                rows.append([
                    snapshot.report_date.isoformat(), window, r.date_start, r.date_stop, level,
                    r.campaign_name, r.adset_name, r.ad_name, r.id,
                    r.spend, r.impressions, r.cpm, r.link_ctr, r.frequency,
                    r.conversations, r.cost_per_conversation if r.cost_per_conversation is not None else "",
                ])
    return rows


def action_rows(snapshot: Snapshot, recs: list[Recommendation], now: datetime) -> list[list]:
    return [
        [now.isoformat(timespec="seconds"), snapshot.report_date.isoformat(), r.kind, r.level,
         r.target_name, r.target_id, r.action, r.reason, "recommended"]
        for r in recs
    ]


def _tab(sheet, name: str, header: list[str]):
    import gspread

    try:
        ws = sheet.worksheet(name)
    except gspread.WorksheetNotFound:
        ws = sheet.add_worksheet(title=name, rows=1000, cols=len(header))
    if ws.row_values(1) != header:
        if not ws.row_values(1):
            ws.update([header], "A1")
        else:
            raise RuntimeError(f"Tab '{name}' row 1 is not the expected header; leave row 1 as the agent wrote it")
    return ws


def write(service_account_json: str, sheet_id: str, snapshot: Snapshot, recs: list[Recommendation], now: datetime) -> str:
    """Append today's rows. Skips if this report date is already in the sheet (safe to re-run)."""
    import gspread

    if not service_account_json or not sheet_id:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEET_ID must be set")
    client = gspread.service_account_from_dict(json.loads(service_account_json))
    sheet = client.open_by_key(sheet_id)

    metrics = _tab(sheet, "metrics", METRICS_HEADER)
    if snapshot.report_date.isoformat() in metrics.col_values(1)[1:]:
        return f"Sheet already has {snapshot.report_date} - skipped writing"
    rows = metrics_rows(snapshot)
    if rows:
        metrics.append_rows(rows, value_input_option="USER_ENTERED")
    actions = action_rows(snapshot, recs, now)
    if actions:
        _tab(sheet, "actions_log", ACTIONS_HEADER).append_rows(actions, value_input_option="RAW")
    return f"Wrote {len(rows)} metric rows and {len(actions)} recommendations to the sheet"
