import json
from datetime import UTC, datetime

import pytest
import yaml

from agent.config import ROOT
from agent.social import comment_dm

NOW = datetime(2026, 10, 27, 18, 0, tzinfo=UTC)
ACCOUNTS = {"instagram_account_id": "ig", "facebook_page_id": "page", "instagram_username": "azmin_digital"}


@pytest.fixture
def cfg():
    return yaml.safe_load((ROOT / "config/comment-dm.yaml").read_text())


class FakeMeta:
    def __init__(self, comments, dm_error=None, follows=True, replies=()):
        self.comments, self.dm_error, self.posts = comments, dm_error, []
        self.follows, self.replies = follows, list(replies)

    def _page_token(self, page_id):
        return "page-token"

    def call(self, method, path, token=None, **params):
        if path == "ig/media":
            return {"data": [{"id": "m1", "timestamp": "2026-10-26T17:00:00+0000", "permalink": "https://ig/p/1"},
                             {"id": "old", "timestamp": "2026-10-01T17:00:00+0000"}]}
        if path == "m1/comments":
            return {"data": self.comments}
        if path == "old/comments":
            raise AssertionError("posts older than the lookback window are not read")
        if path == "page/conversations":
            return {"data": [{"messages": {"data": self.replies}}]}
        if path == "u1":
            if self.follows is None:
                raise RuntimeError("profile not available")
            return {"is_user_follow_business": self.follows}
        if method == "POST":
            if path.endswith("/messages") and self.dm_error:
                raise RuntimeError(self.dm_error)
            self.posts.append((path, token, params))
            return {"id": "x", "recipient_id": "u1"}
        return {}


def _c(cid, text, user="someone"):
    return {"id": cid, "text": text, "username": user, "timestamp": f"2026-10-26T18:0{cid[-1]}:00+0000"}


@pytest.mark.parametrize("text,expected", [
    ("SKILL", "SKILL"), ("skills please 🙏", "SKILL"), ("Skill!", "SKILL"),
    ("skillful video", None), ("nice", None), ("", None),
])
def test_match_keyword(cfg, text, expected):
    assert comment_dm.match_keyword(text, cfg["keywords"]) == expected


def test_auto_sends_one_dm_and_public_reply(cfg):
    cfg |= {"mode": "auto", "follow_gate": False}
    meta, state = FakeMeta([_c("c1", "SKILL"), _c("c2", "love it")]), {"done": {}}
    lines = comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    dm = [p for p in meta.posts if p[0] == "page/messages"]
    assert len(dm) == 1 and dm[0][1] == "page-token"
    assert '"comment_id": "c1"' in dm[0][2]["recipient"]
    assert "find-skills.pdf" in dm[0][2]["message"]
    assert [p[0] for p in meta.posts if p[0].endswith("/replies")] == ["c1/replies"]
    assert state["done"]["c1"].endswith("sent SKILL") and "no-keyword" in state["done"]["c2"]
    assert lines == ["📩 Guide sent by DM: 1× SKILL"]
    # second run: nothing is sent again
    meta.posts.clear()
    assert comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True) == [] and meta.posts == []


def test_auto_falls_back_to_telegram_when_meta_refuses(cfg):
    cfg["mode"] = "auto"
    meta, state = FakeMeta([_c("c1", "skill")], dm_error="(#10) permission missing"), {"done": {}}
    text = "\n".join(comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True))
    assert "@someone" in text and "auto DM failed" in text and "find-skills.pdf" in text
    assert meta.posts == []  # no public "check your DMs" when no DM went out
    assert "alerted" in state["done"]["c1"]


def test_alert_mode_never_sends(cfg):
    cfg["mode"] = "alert"
    meta, state = FakeMeta([_c("c1", "SKILL")]), {"done": {}}
    text = "\n".join(comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True))
    assert meta.posts == [] and "@someone" in text and "DM text for SKILL" in text


def test_dry_run_and_own_comments(cfg):
    cfg["mode"] = "auto"
    meta, state = FakeMeta([_c("c1", "SKILL"), _c("c2", "SKILL", user="azmin_digital")]), {"done": {}}
    text = "\n".join(comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=False))
    assert meta.posts == [] and state["done"] == {} and "@someone" in text and "@azmin_digital:" not in text


def test_cap_leaves_rest_for_next_run(cfg):
    cfg |= {"mode": "auto", "max_per_run": 1}
    meta, state = FakeMeta([_c("c1", "skill"), _c("c2", "skill")]), {"done": {}}
    comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    assert list(state["done"]) == ["c1"]


def _dms(meta):
    return [json.loads(p[2]["message"])["text"] for p in meta.posts if p[0] == "page/messages"]


def _reply(at="2026-10-27T10:00:00+0000", mid="r1"):
    return {"id": mid, "created_time": at, "from": {"id": "u1"}}


def test_follow_gate_asks_first_then_sends_guide_to_follower(cfg):
    cfg["mode"] = "auto"
    meta, state = FakeMeta([_c("c1", "SKILL")]), {"done": {}}
    lines = comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    assert "Follow @azmin_digital" in _dms(meta)[0] and "find-skills.pdf" not in _dms(meta)[0]
    assert "u1" in state["waiting"] and lines[0].startswith("👋 Asked to follow")
    # no reply yet: nothing happens
    meta.posts.clear()
    comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    assert meta.posts == []
    # they reply DONE and follow -> guide
    meta.replies = [_reply()]
    lines = comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    assert "find-skills.pdf" in _dms(meta)[0] and json.loads(meta.posts[0][2]["recipient"]) == {"id": "u1"}
    assert "u1" not in state["waiting"] and "📩 Guide sent by DM: 1× SKILL" in lines


def test_follow_gate_nudges_non_followers_then_hands_over(cfg):
    cfg["mode"] = "auto"
    meta, state = FakeMeta([_c("c1", "SKILL")], follows=False), {"done": {}}
    comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    for n in range(3):
        meta.posts.clear()
        meta.replies = [_reply(f"2026-10-27T1{n}:00:00+0000", f"r{n}")]
        lines = comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
        if n < 2:
            assert "can't see your follow" in _dms(meta)[0]
    assert meta.posts == [] and "u1" not in state["waiting"] and any("without following" in x for x in lines)


def test_follow_gate_sends_guide_when_meta_wont_say(cfg):
    cfg["mode"] = "auto"
    meta, state = FakeMeta([_c("c1", "SKILL")], follows=None), {"done": {}}
    comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    meta.posts.clear()
    meta.replies = [_reply()]
    comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    assert "find-skills.pdf" in _dms(meta)[0]


def test_dm_falls_back_to_instagram_route(cfg):
    class PageRouteFails(FakeMeta):
        def call(self, method, path, token=None, **params):
            if path == "page/messages":
                raise RuntimeError("(#200) page route refused")
            return super().call(method, path, token=token, **params)

    cfg |= {"mode": "auto", "follow_gate": False}
    meta, state = PageRouteFails([_c("c1", "SKILL")]), {"done": {}}
    comment_dm.run(meta, cfg, ACCOUNTS, state, NOW, live=True)
    assert [p[0] for p in meta.posts][:1] == ["ig/messages"] and "sent" in state["done"]["c1"]
