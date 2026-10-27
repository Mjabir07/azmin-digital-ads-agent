"""Series rule (Jabir 27 Oct): every "AI Tools with Yara" reel asks for a follow AND a keyword comment,
and the keyword has a guide in config/comment-dm.yaml so the auto-DM can answer it."""

import re

import pytest
import yaml

from agent.config import ROOT

KEYWORDS = yaml.safe_load((ROOT / "config/comment-dm.yaml").read_text())["keywords"]
YARA = sorted(p for p in (ROOT / "marketing/queue").glob("*.yaml") if "yara" in p.name)


@pytest.mark.parametrize("path", YARA, ids=[p.name for p in YARA])
def test_yara_caption_asks_follow_and_comment(path):
    caption = yaml.safe_load(path.read_text()).get("caption", "")
    assert re.search(r"\bfollow\b", caption, re.IGNORECASE), f"{path.name}: caption has no follow ask"
    m = re.search(r"\b(?i:comment)\s+([A-Z0-9-]{3,})\b", caption)
    assert m, f"{path.name}: caption has no 'Comment WORD' ask"
    assert m.group(1) in KEYWORDS, f"{path.name}: keyword {m.group(1)} has no guide in config/comment-dm.yaml"
