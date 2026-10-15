from pathlib import Path

import yaml

from agent.config import ROOT, load_yaml
from agent.creatives.render import TEMPLATES, page

SPECS = sorted((ROOT / "marketing/creatives").glob("*.yaml"))
ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def _confirmed_prices() -> set[str]:
    return {str(p["price_from"]) for p in load_yaml("packages.yaml")["packages"] if p.get("confirmed")}


def _creatives(spec: Path):
    data = yaml.safe_load(spec.read_text(encoding="utf-8"))
    for item in data["creatives"]:
        yield {**data.get("defaults", {}), **item}


def test_every_creative_renders_to_html():
    assert SPECS
    for spec in SPECS:
        for c in _creatives(spec):
            assert c["template"] in TEMPLATES, c["id"]
            assert "<body" in page(c)


def test_prices_on_creatives_are_confirmed_by_jabir():
    """The agent never invents prices: every price shown must be a confirmed package price."""
    confirmed = _confirmed_prices()
    for spec in SPECS:
        for c in _creatives(spec):
            html = page(c)
            if "big-price" in html or "999" in html:
                assert str(c["price"]["amount"]).translate(ARABIC_DIGITS) in confirmed, c["id"]
