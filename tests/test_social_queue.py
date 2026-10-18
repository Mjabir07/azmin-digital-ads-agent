import datetime as dt

import httpx

from agent.social import approvals, queue


def _item(tmp_path, status="draft", post_at="2026-10-20 19:30"):
    p = tmp_path / "x.yaml"
    item = queue.Item(p, {"id": "w02-x", "type": "reel", "video": "v.mp4", "platforms": ["instagram"],
                          "post_at": post_at, "caption": "hi", "status": status})
    item.save()
    return item


def test_due_only_when_approved_and_time_reached(tmp_path):
    before = dt.datetime(2026, 10, 20, 19, 0, tzinfo=queue.DUBAI)
    after = dt.datetime(2026, 10, 20, 19, 31, tzinfo=queue.DUBAI)
    assert not _item(tmp_path, "pending").due(after)
    approved = _item(tmp_path, "approved")
    assert not approved.due(before)
    assert approved.due(after)


def test_callback_from_other_chat_is_ignored(tmp_path, monkeypatch):
    monkeypatch.setattr(queue, "QUEUE", tmp_path)
    _item(tmp_path, "pending")
    cq = {"id": "1", "data": "approve:w02-x", "message": {"message_id": 5, "chat": {"id": 999}}}
    with httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(200, json={"ok": True}))) as http:
        assert approvals.handle_callback(http, "https://t", cq, "123") is None
    assert queue.load_all(tmp_path)[0].status == "pending"


def test_approve_and_reject(tmp_path, monkeypatch):
    monkeypatch.setattr(queue, "QUEUE", tmp_path)
    _item(tmp_path, "pending")
    calls = []
    with httpx.Client(transport=httpx.MockTransport(lambda r: calls.append(r.url.path) or httpx.Response(200, json={"ok": True}))) as http:
        line = approvals.handle_callback(http, "https://t", {"id": "1", "data": "approve:w02-x", "message": {"message_id": 5, "chat": {"id": 123}}}, "123")
        assert "Approved" in line
        again = approvals.handle_callback(http, "https://t", {"id": "2", "data": "reject:w02-x", "message": {"message_id": 5, "chat": {"id": 123}}}, "123")
        assert "Already approved" in again
    assert any(p.endswith("editMessageReplyMarkup") for p in calls)


def test_collect_uses_forwarded_update(tmp_path, monkeypatch):
    import json

    from agent.media import collect

    monkeypatch.setattr(queue, "QUEUE", tmp_path)
    _item(tmp_path, "pending")
    update = {"update_id": 1, "callback_query": {"id": "9", "data": "approve:w02-x", "message": {"message_id": 5, "chat": {"id": 123}}}}
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "t")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "123")
    monkeypatch.setenv("TELEGRAM_UPDATE", json.dumps(update))
    seen = []

    def handler(request):
        seen.append(request.url.path)
        return httpx.Response(200, json={"ok": True, "result": []})

    real_client = httpx.Client
    monkeypatch.setattr(collect.httpx, "Client", lambda **kw: real_client(transport=httpx.MockTransport(handler)))
    monkeypatch.setattr(collect.telegram, "send_message", lambda *a: None)
    monkeypatch.setattr(collect.sys, "argv", ["collect", "--quiet"])
    assert collect.main() == 0
    assert queue.load_all(tmp_path)[0].status == "approved"
    assert not any(p.endswith("getUpdates") for p in seen)  # forwarded updates never poll
