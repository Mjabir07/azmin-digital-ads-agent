from datetime import date, datetime

import pytest

from agent.config import load_yaml
from agent.samples import load_snapshot

TODAY = date(2026, 10, 15)


@pytest.fixture
def targets():
    return load_yaml("targets.yaml")


@pytest.fixture
def limits():
    return load_yaml("limits.yaml")


@pytest.fixture
def now():
    from zoneinfo import ZoneInfo

    return datetime(2026, 10, 15, 9, 0, tzinfo=ZoneInfo("Asia/Dubai"))


@pytest.fixture
def snapshot():
    return load_snapshot(TODAY)
