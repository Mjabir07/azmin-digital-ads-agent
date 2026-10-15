# AZMIN DIGITAL Ads Agent

AI marketing agent that runs and reports on Meta Click-to-WhatsApp ads for AZMIN DIGITAL's
website design services (UAE, then KSA). Runs fully in the cloud: GitHub + GitHub Actions +
Google Sheets. Every money decision needs human approval.

- New here? Read `START_HERE.md`.
- Project rules for Claude Code: `CLAUDE.md`
- Strategy: `docs/PLAYBOOK.md` · System design: `docs/SPEC.md` · Setup: `docs/SETUP.md`

## Phase 1 - daily report (read-only)

```
uv sync
uv run pytest                                  # tests
uv run python -m agent.daily --dry-run --sample  # made-up data, prints the report, sends nothing
uv run python -m agent.daily                   # real run (GitHub Actions does this daily)
```

Code: `agent/ads/fetch_insights.py` (Meta, read-only) → `agent/rules/engine.py` (CLAUDE.md rules)
→ `agent/storage/sheets.py` (Google Sheet `metrics` + `actions_log`) → `agent/report/daily.py`
(Claude writes the report; simple template if Claude is unavailable) → `agent/notify/telegram.py`.
Limits and targets: `config/*.yaml`.
