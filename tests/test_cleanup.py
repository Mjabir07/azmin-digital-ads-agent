import datetime as dt

from agent.social import cleanup, queue

NOW = dt.datetime(2026, 11, 1, 12, 0, tzinfo=queue.DUBAI)


def _item(tmp_path, **data):
    item = queue.Item(tmp_path / f"{data['id']}.yaml", {"post_at": "2026-10-26 21:00", "status": "posted", **data})
    item.save()
    return item


def test_removes_posted_media_keeps_record(tmp_path, monkeypatch):
    monkeypatch.setattr(cleanup, "ROOT", tmp_path)
    (tmp_path / "v.mp4").write_bytes(b"x")
    (tmp_path / "clips").mkdir()
    (tmp_path / "clips/a.mp4").write_bytes(b"x")
    item = _item(tmp_path, id="ep1", video="v.mp4", cover="missing.jpg", cleanup=["clips"], posted={"instagram": "https://ig"})
    assert cleanup.run([item], NOW) == ["v.mp4", "clips"]
    assert not (tmp_path / "v.mp4").exists() and not (tmp_path / "clips").exists()
    assert item.data["cleaned"] == "2026-11-01" and item.data["posted"]["instagram"] == "https://ig"


def test_keeps_recent_unposted_and_outside_paths(tmp_path, monkeypatch):
    monkeypatch.setattr(cleanup, "ROOT", tmp_path)
    for f in ("a.mp4", "b.mp4"):
        (tmp_path / f).write_bytes(b"x")
    recent = _item(tmp_path, id="r", video="a.mp4", post_at="2026-10-31 19:30")
    pending = _item(tmp_path, id="p", video="b.mp4", status="approved")
    escape = _item(tmp_path, id="e", cleanup=["../outside.txt"])
    assert cleanup.run([recent, pending, escape], NOW) == []
    assert (tmp_path / "a.mp4").exists() and (tmp_path / "b.mp4").exists()
