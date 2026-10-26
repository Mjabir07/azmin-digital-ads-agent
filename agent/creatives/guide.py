"""Render a lead-magnet guide (HTML in marketing/guides/) to an A4 PDF next to it.

    uv run --group creatives python -m agent.creatives.guide marketing/guides/find-skills.html
"""

from __future__ import annotations

import sys
from pathlib import Path

from agent.config import ROOT


def render(html_path: Path) -> Path:
    from playwright.sync_api import sync_playwright

    from agent.creatives.render import _browser

    target = html_path.with_suffix(".pdf")
    with sync_playwright() as p:
        browser = _browser(p)
        page = browser.new_page()
        page.goto(html_path.as_uri())
        page.evaluate("document.fonts.ready")
        page.pdf(path=str(target), format="A4", print_background=True, margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        browser.close()
    return target


if __name__ == "__main__":
    print(render(Path(sys.argv[1]).resolve()).relative_to(ROOT))
