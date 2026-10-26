import pytest
import yaml

from agent.social import publish, queue


@pytest.fixture(autouse=True)
def no_wait(monkeypatch):
    monkeypatch.setattr(publish, "PUBLISH_WAIT", 0)
    monkeypatch.setattr(publish.time, "sleep", lambda s: None)


class FakeMeta(publish.Meta):
    """Answers like the Graph API; media_publish fails `fail_publish` times first."""

    def __init__(self, fail_publish=0, statuses=("FINISHED",)):
        self.fail_publish, self.statuses, self.calls = fail_publish, list(statuses), []

    def call(self, method, path, token=None, **params):
        self.calls.append(path)
        if path.endswith("/media"):
            return {"id": "box1"}
        if path == "box1":
            return {"status_code": self.statuses.pop(0) if len(self.statuses) > 1 else self.statuses[0]}
        if path.endswith("/media_publish"):
            if self.fail_publish:
                self.fail_publish -= 1
                raise RuntimeError(f"Meta API error on {path}: The requested resource does not exist")
            return {"id": "m1"}
        return {}


def test_story_publish_retries_transient_error():
    meta = FakeMeta(fail_publish=1)
    assert meta.instagram_story("ig", "https://x/s.jpg") == "Instagram story (live for 24 h)"
    assert meta.calls.count("ig/media_publish") == 2


def test_story_publish_gives_up_after_three_tries():
    meta = FakeMeta(fail_publish=5)
    with pytest.raises(RuntimeError):
        meta.instagram_story("ig", "https://x/s.jpg")
    assert meta.calls.count("ig/media_publish") == 3


def test_waits_for_container_to_finish():
    meta = FakeMeta(statuses=("IN_PROGRESS", "IN_PROGRESS", "FINISHED"))
    meta.instagram_story("ig", "https://x/s.jpg")
    assert meta.calls.count("box1") == 3


def _item(tmp_path, **data):
    path = tmp_path / "i.yaml"
    item = queue.Item(path, {"id": "d04", "status": "approved", **data})
    item.save()
    return item


def test_partial_failure_stays_approved_for_retry(tmp_path):
    item = _item(tmp_path)
    msg = publish.record_result(item, {"facebook": "ok"}, ["instagram: boom"])
    saved = yaml.safe_load(item.path.read_text())
    assert saved["status"] == "approved" and saved["attempts"] == 1
    assert saved["posted"] == {"facebook": "ok"}
    assert "Will retry" in msg


def test_partial_failure_closes_after_max_attempts(tmp_path):
    item = _item(tmp_path, attempts=publish.MAX_ATTEMPTS - 1)
    msg = publish.record_result(item, {"facebook": "ok"}, ["instagram: boom"])
    assert item.data["status"] == "posted"
    assert "Will retry" not in msg


def test_full_failure_after_max_attempts_is_failed(tmp_path):
    item = _item(tmp_path, attempts=publish.MAX_ATTEMPTS - 1)
    publish.record_result(item, {}, ["instagram: boom", "facebook: boom"])
    assert item.data["status"] == "failed"


def test_success_is_posted(tmp_path):
    item = _item(tmp_path)
    assert publish.record_result(item, {"instagram": "a", "facebook": "b"}, []).startswith("✅ Posted d04")
    assert item.data["status"] == "posted" and "attempts" not in item.data


def test_reel_cover_is_sent_to_instagram():
    meta = FakeMeta()
    sent = {}
    orig = meta.call

    def spy(method, path, token=None, **params):
        if path.endswith("/media"):
            sent.update(params)
        return orig(method, path, token, **params)

    meta.call = spy
    meta.instagram_reel("ig", "https://x/v.mp4", "cap", "https://x/cover.jpg")
    assert sent["cover_url"] == "https://x/cover.jpg" and sent["media_type"] == "REELS"
