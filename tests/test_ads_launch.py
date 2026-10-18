import pytest

from agent.ads import launch


def _spec(*budgets):
    return {"adsets": [{"name": f"s{i}", "daily_budget_aed": b} for i, b in enumerate(budgets)]}


def test_limits_accept_launch_plan():
    assert launch.check_limits(_spec(50)) == 50


def test_spend_cap_minimum():
    with pytest.raises(launch.LimitError):
        launch.check_limits({**_spec(50), "campaign": {"spend_cap_aed": 50}})


def test_limits_reject_adset_over_150():
    with pytest.raises(launch.LimitError):
        launch.check_limits(_spec(151))


def test_limits_reject_account_over_300():
    with pytest.raises(launch.LimitError):
        launch.check_limits(_spec(150, 150, 10))


def test_spec_file_is_within_limits():
    import yaml
    spec = yaml.safe_load((launch.ROOT / "marketing/ads/2026-10-uae-website-leads.yaml").read_text())
    assert launch.check_limits(spec) <= launch.LIMITS["account_daily_budget_max"]


def test_targeting_excludes_audience_network_and_tourists():
    spec = {"targeting_base": {"location_types": ["home"], "age_min": 27, "age_max": 55,
                               "placements": {"publisher_platforms": ["facebook", "instagram"]}}}
    ids = {"cities": [{"key": "1"}], "locales": [{"key": 6}], "interests": [{"id": "9"}], "behaviors": [{"id": "8"}]}
    t = launch.targeting(spec, ids, advantage=False)
    assert t["geo_locations"]["location_types"] == ["home"]
    assert "audience_network" not in t["publisher_platforms"]
    assert t["targeting_automation"]["advantage_audience"] == 0
