from datetime import datetime

from agent import daily
from agent.report.daily import build_facts, write_template
from agent.rules.engine import evaluate
from agent.storage.sheets import METRICS_HEADER, action_rows, metrics_rows


def test_facts_totals(snapshot, targets, limits, now):
    facts = build_facts(snapshot, evaluate(snapshot, targets, limits, now), targets)
    assert facts["last_7_days"]["spend"] == 460.0
    assert facts["last_7_days"]["conversations"] == 21
    assert facts["yesterday"]["conversations"] == 4
    assert len(facts["recommendations"]) == 4


def test_template_report_mentions_actions(snapshot, targets, limits, now):
    text = write_template(build_facts(snapshot, evaluate(snapshot, targets, limits, now), targets))
    assert "Pain-Reel: Pause this ad" in text
    assert "AED 37.50 -> AED 45.00" in text
    assert "Nothing was changed in Meta" in text


def test_sheet_rows_match_header(snapshot, targets, limits, now):
    rows = metrics_rows(snapshot)
    assert len(rows) == 2 * (1 + 2 + 4)  # windows x (campaign + ad sets + ads)
    assert all(len(r) == len(METRICS_HEADER) for r in rows)
    acts = action_rows(snapshot, evaluate(snapshot, targets, limits, now), now)
    assert all(r[-1] == "recommended" for r in acts)


def test_dry_run_with_sample_sends_nothing(monkeypatch, capsys):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    def boom(*a, **k):
        raise AssertionError("dry run must not send or write")

    monkeypatch.setattr(daily.telegram, "send_message", boom)
    monkeypatch.setattr(daily.sheets, "write", boom)
    assert daily.run(["--dry-run", "--sample"]) == 0
    assert "What to do today" in capsys.readouterr().out
