"""Free repo space: delete the media files of posts that are already live on Instagram/Facebook.

A queue item keeps its caption, date and the `posted:` links (the record); only its files go:
`video`, `image`, `images`, `cover`, plus any extra paths listed under `cleanup:` (an episode's Flow clips,
voice files, ...). Runs weekly (.github/workflows/cleanup.yml); waits KEEP_DAYS after posting.
Note: git history keeps old versions, so this shrinks every checkout, not the total GitHub size.

    uv run python -m agent.social.cleanup [--dry-run]
"""

from __future__ import annotations

import argparse
import datetime as dt
import shutil
import sys

from agent.config import ROOT
from agent.social import queue

KEEP_DAYS = 2


def media_paths(item: queue.Item) -> list[str]:
    d = item.data
    return [p for p in [d.get("video"), d.get("image"), *(d.get("images") or []), d.get("cover"), *(d.get("cleanup") or [])] if p]


def run(items: list[queue.Item], now: dt.datetime, dry_run: bool = False) -> list[str]:
    removed = []
    for item in items:
        if item.status != "posted" or item.data.get("cleaned") or item.post_at > now - dt.timedelta(days=KEEP_DAYS):
            continue
        for rel in media_paths(item):
            path = (ROOT / rel).resolve()
            if ROOT.resolve() not in path.parents or rel.startswith(("config", "agent", ".github")):
                continue  # only ever delete media inside the repo
            if path.exists():
                removed.append(rel)
                if not dry_run:
                    shutil.rmtree(path) if path.is_dir() else path.unlink()
        if not dry_run:
            item.data["cleaned"] = now.strftime("%Y-%m-%d")
            item.save()
    return removed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    removed = run(queue.load_all(), dt.datetime.now(queue.DUBAI), args.dry_run)
    print(("Would remove:\n" if args.dry_run else "Removed:\n") + "\n".join(removed) if removed else "Nothing to clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
