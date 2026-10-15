"""Take phone-size screenshots of the portfolio sites in brand/portfolio/sites.yaml.

Runs on GitHub Actions (.github/workflows/portfolio-screenshots.yml), which can reach the sites.
"""

from __future__ import annotations

import sys

import yaml

from agent.config import ROOT

PORTFOLIO = ROOT / "brand/portfolio"


def main() -> int:
    from playwright.sync_api import sync_playwright

    sites = yaml.safe_load((PORTFOLIO / "sites.yaml").read_text(encoding="utf-8"))["sites"]
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844}, device_scale_factor=3, is_mobile=True, has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 "
            "(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
        )
        for site in sites:
            page = ctx.new_page()
            try:
                page.goto(site["url"], wait_until="networkidle", timeout=60_000)
                page.wait_for_timeout(2500)  # let sliders / fade-ins settle
                target = PORTFOLIO / f"{site['slug']}-mobile.png"
                page.screenshot(path=str(target))
                print(f"saved {target.relative_to(ROOT)}")
            except Exception as e:  # keep going for the other sites
                failed += 1
                print(f"FAILED {site['url']}: {e}", file=sys.stderr)
            finally:
                page.close()
        browser.close()
    return 1 if failed == len(sites) else 0


if __name__ == "__main__":
    sys.exit(main())
