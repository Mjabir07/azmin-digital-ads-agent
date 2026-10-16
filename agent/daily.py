"""Phase 1 daily report: fetch Meta insights -> rules -> Google Sheet -> report -> Telegram.

Read-only: nothing in this module changes ads, budgets or anything else in Meta.

    python -m agent.daily                     # real run (what GitHub Actions does)
    python -m agent.daily --dry-run --sample  # made-up data, prints the report, sends nothing
"""

from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime

from agent.ads.fetch_insights import fetch_snapshot
from agent.config import Settings, load_yaml, redact
from agent.notify import telegram
from agent.report.daily import build_facts, write_template, write_with_claude
from agent.rules.engine import evaluate
from agent.storage import sheets

log = logging.getLogger("agent")


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="AZMIN DIGITAL daily ads report (read-only)")
    p.add_argument("--dry-run", action="store_true", help="print the report; don't write to Google Sheets or send to Telegram")
    p.add_argument("--sample", action="store_true", help="use made-up sample data instead of calling Meta")
    p.add_argument("--no-claude", action="store_true", help="use the simple template instead of Claude")
    return p.parse_args(argv)


def write_report(facts: dict, settings: Settings, use_claude: bool) -> str:
    if not use_claude:
        return write_template(facts)
    if not settings.anthropic_api_key:
        log.warning("ANTHROPIC_API_KEY not set - using the simple template report")
        return write_template(facts)
    try:
        return write_with_claude(facts, settings.anthropic_api_key, settings.claude_model)
    except Exception as e:  # never lose the report because the AI writer failed
        log.warning("Claude report failed (%s) - using the simple template", redact(str(e), settings.secrets()))
        return write_template(facts) + "\n\n(The AI writer was unavailable today, so this is the simple version.)"


def run(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)  # its request logs would include tokens

    settings = Settings.from_env()
    now = datetime.now(settings.timezone)
    targets, limits = load_yaml("targets.yaml"), load_yaml("limits.yaml")

    try:
        if args.sample:
            from agent.samples import load_snapshot

            log.info("Using SAMPLE data (made up, not your real ads)")
            snapshot = load_snapshot(now.date())
        else:
            log.info("Fetching insights from Meta (read-only)")
            snapshot = fetch_snapshot(settings, now.date())
    except Exception as e:
        msg = redact(f"⚠️ Daily ads report failed: could not read Meta data.\n{e}", settings.secrets())
        log.error(msg)
        if not args.dry_run and settings.telegram_bot_token:
            try:
                telegram.send_message(settings.telegram_bot_token, settings.telegram_chat_id, msg)
            except Exception as te:
                log.error("Telegram alert also failed: %s", redact(str(te), settings.secrets()))
        return 1

    recs = evaluate(snapshot, targets, limits, now)
    log.info("Report date %s: %d recommendation(s)", snapshot.report_date, len(recs))
    facts = build_facts(snapshot, recs, targets)
    report = write_report(facts, settings, use_claude=not args.no_claude)

    if args.dry_run:
        rows = sheets.metrics_rows(snapshot)
        log.info("DRY RUN - would write %d metric rows and %d recommendations to Google Sheets", len(rows), len(recs))
        log.info("DRY RUN - would send this report to Telegram:")
        print("\n" + report + "\n")
        return 0

    ok = True
    try:
        log.info(sheets.write(settings.google_service_account_json, settings.google_sheet_id, snapshot, recs, now))
    except Exception as e:
        ok = False
        err = redact(str(e), settings.secrets())
        log.error("Google Sheets write failed: %s", err)
        report += f"\n\n⚠️ Could not save to Google Sheets: {err}"

    try:
        telegram.send_message(settings.telegram_bot_token, settings.telegram_chat_id, report)
        log.info("Report sent to Telegram")
    except Exception as e:
        log.error("Telegram send failed: %s", redact(str(e), settings.secrets()))
        print("\n" + report + "\n")
        return 1
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(run())
