"""Pull this week's trending searches (Google Trends RSS, free, no key) for the UAE and KSA.

Writes marketing/research/trends/<date>-google-trends.md — raw input for the trend-scout skill,
which turns trends into on-brand AZMIN DIGITAL content ideas.
"""

from __future__ import annotations

import datetime as dt
import re
import sys

import httpx

from agent.config import ROOT

GEOS = {"AE": "UAE", "SA": "Saudi Arabia"}
OUT = ROOT / "marketing/research/trends"


def fetch(geo: str) -> list[tuple[str, str, list[str]]]:
    xml = httpx.get(f"https://trends.google.com/trending/rss?geo={geo}", timeout=30,
                    headers={"User-Agent": "Mozilla/5.0"}).text
    items = []
    for block in re.findall(r"<item>(.*?)</item>", xml, re.S):
        title = re.search(r"<title>(.*?)</title>", block, re.S)
        traffic = re.search(r"<ht:approx_traffic>(.*?)</ht:approx_traffic>", block)
        news = re.findall(r"<ht:news_item_title>(.*?)</ht:news_item_title>", block, re.S)
        if title:
            items.append((title.group(1).strip(), traffic.group(1) if traffic else "?", [n.strip() for n in news[:2]]))
    return items


def main() -> int:
    today = dt.date.today().isoformat()
    lines = [f"# Google Trends — {today}", "", "Raw trending searches. Not all are usable — the trend-scout skill filters them.", ""]
    for geo, name in GEOS.items():
        lines += [f"## {name}", "", "| Searches | Trend | Related headlines |", "| --- | --- | --- |"]
        for title, traffic, news in fetch(geo):
            lines.append(f"| {traffic} | {title} | {' / '.join(news) or '-'} |")
        lines.append("")
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{today}-google-trends.md"
    path.write_text("\n".join(lines).replace("&amp;", "&").replace("&#39;", "'").replace("&apos;", "'").replace("&quot;", '"'))
    print(f"Saved {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
