"""Content queue: one YAML file per post in marketing/queue/.

Life cycle: draft -> pending (sent to Telegram for approval) -> approved | rejected -> posted | failed.
Nothing is ever published unless Jabir tapped ✅ Approve in Telegram (status "approved").
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

from agent.config import ROOT

QUEUE = ROOT / "marketing/queue"
DUBAI = ZoneInfo("Asia/Dubai")


@dataclass
class Item:
    path: Path
    data: dict = field(default_factory=dict)

    @property
    def id(self) -> str:
        return self.data["id"]

    @property
    def status(self) -> str:
        return self.data.get("status", "draft")

    @property
    def post_at(self) -> dt.datetime:
        return dt.datetime.strptime(str(self.data["post_at"]), "%Y-%m-%d %H:%M").replace(tzinfo=DUBAI)

    def due(self, now: dt.datetime | None = None) -> bool:
        return self.status == "approved" and self.post_at <= (now or dt.datetime.now(DUBAI))

    def save(self) -> None:
        self.path.write_text(yaml.safe_dump(self.data, sort_keys=False, allow_unicode=True, width=1000))


def load_all(folder: Path | None = None) -> list[Item]:
    items = [Item(p, yaml.safe_load(p.read_text())) for p in sorted((folder or QUEUE).glob("*.yaml"))]
    return [i for i in items if i.data and i.data.get("id")]


def find(item_id: str, folder: Path | None = None) -> Item | None:
    return next((i for i in load_all(folder) if i.id == item_id), None)


def when(item: Item) -> str:
    return item.post_at.strftime("%a %d %b, %I:%M %p").replace(" 0", " ") + " Dubai"
