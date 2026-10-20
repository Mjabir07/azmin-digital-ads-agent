"""AZMIN Editorial — the signature feed look (carousels, posts, stories, reel covers).

Cream paper + ink + brand blue, Inter Tight with Instrument Serif italic accent words (*like this*),
same header on every design, so the Instagram grid reads as one brand. Matches the reel end cards.

    uv run --group creatives python -m agent.creatives.editorial marketing/posts/<spec>.yaml

Spec: `designs:` list of {name, kind, size?, ...}. Output JPEGs go to a folder next to the spec.
"""

from __future__ import annotations

import base64
import html
import re
import sys
from pathlib import Path

import yaml

from agent.config import ROOT

FONTS = ROOT / "brand/fonts"
LOGO = ROOT / "brand/logo.png"
SIZES = {"portrait": (1080, 1350), "story": (1080, 1920), "square": (1080, 1080)}
PHONE = "+971 56 724 7597"
WA = ('<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="{c}"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.87-9.88 9.87zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42z"/></svg>')

CSS = """
@font-face{font-family:Inter Tight;font-weight:100 900;src:url(%(f)s/InterTight.woff2)}
@font-face{font-family:Serif;font-style:italic;src:url(%(f)s/InstrumentSerif-400i.woff2)}
*{box-sizing:border-box;margin:0;padding:0}
body{width:%(w)dpx;height:%(h)dpx;font-family:'Inter Tight',sans-serif;overflow:hidden;position:relative;color:var(--ink);background:var(--bg)}
.paper{--bg:#F4F1EA;--ink:#0B0B0C;--muted:#6B6A66;--line:rgba(11,11,12,.07)}
.navy{--bg:#071A3D;--ink:#F4F1EA;--muted:#9FB0CE;--line:rgba(255,255,255,.06)}
.blue{--bg:#0062F5;--ink:#FFFFFF;--muted:#CFE0FF;--line:rgba(255,255,255,.08)}
.grid{position:absolute;inset:0;background-image:linear-gradient(var(--line) 2px,transparent 2px),linear-gradient(90deg,var(--line) 2px,transparent 2px);background-size:120px 120px;background-position:-2px -2px}
.head{position:absolute;top:56px;left:70px;right:70px;display:flex;align-items:center;gap:16px;font-size:30px;font-weight:700}
.logo{width:58px;height:58px;border-radius:29px;background:#fff;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.12)}
.logo img{width:40px}
.count{margin-left:auto;font-family:Serif;font-style:italic;font-weight:400;font-size:38px;color:var(--muted)}
em{font-family:Serif;font-style:italic;font-weight:400;letter-spacing:0;position:relative;white-space:nowrap}
em.mark{color:#fff;padding:0 .12em;background:linear-gradient(transparent 18%%,#0062F5 18%%,#0062F5 88%%,transparent 88%%)}
.blue em.mark{background:linear-gradient(transparent 18%%,#0B0B0C 18%%,#0B0B0C 88%%,transparent 88%%)}
.main{position:absolute;left:80px;right:80px;top:150px;bottom:150px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.foot{position:absolute;bottom:56px;left:70px;right:70px;display:flex;align-items:center;justify-content:space-between;font-size:30px;font-weight:600;color:var(--muted)}
.pill{display:inline-flex;align-items:center;gap:16px;background:#25D366;color:#fff;border-radius:999px;font-weight:800}
.chip{display:inline-block;border:2px solid var(--ink);border-radius:999px;padding:10px 24px;font-size:28px;font-weight:700;letter-spacing:3px}
"""


def rich(text: str, mark: bool = True) -> str:
    """Escape text; *word* → serif italic accent (on a blue marker when mark=True)."""
    t = html.escape(str(text)).replace("\n", "<br>")
    return re.sub(r"\*(.+?)\*", lambda m: f'<em class="{"mark" if mark else ""}">{m.group(1)}</em>', t)


def head(d: dict) -> str:
    count = f'<span class="count">{d["count"]}</span>' if d.get("count") else ""
    logo = "data:image/png;base64," + base64.b64encode(LOGO.read_bytes()).decode()
    return f'<div class="head"><div class="logo"><img src="{logo}"></div>azmindigital{count}</div>'


def k_cover(d: dict, w: int, h: int) -> str:
    return f"""<div class="grid"></div>{head(d)}
    <div class="main">
      {f'<div class="chip">{html.escape(d["kicker"])}</div>' if d.get("kicker") else ""}
      <div style="margin-top:44px;font-size:{d.get("title_size", 124)}px;font-weight:800;letter-spacing:-6px;line-height:1.02">{rich(d["title"])}</div>
      {f'<div style="margin-top:40px;font-size:42px;font-weight:500;color:var(--muted);line-height:1.35">{rich(d["sub"], False)}</div>' if d.get("sub") else ""}
    </div>
    <div class="foot"><span>{html.escape(d.get("foot", "Save this for later"))}</span><span style="font-family:Serif;font-style:italic;font-size:44px;color:var(--ink)">swipe →</span></div>"""


def k_point(d: dict, w: int, h: int) -> str:
    return f"""<div class="grid"></div>{head(d)}
    <div class="main">
      <div style="font-family:Serif;font-style:italic;font-size:220px;line-height:1;color:#0062F5">{html.escape(d["num"])}</div>
      <div style="margin-top:30px;font-size:112px;font-weight:800;letter-spacing:-5px;line-height:1.04">{rich(d["title"])}</div>
      <div style="margin-top:48px;font-size:50px;font-weight:500;line-height:1.38;color:var(--muted);max-width:900px">{rich(d["body"], False)}</div>
    </div>
    <div class="foot"><span>{html.escape(d.get("foot", "azmindigital.com"))}</span><span style="font-family:Serif;font-style:italic;font-size:44px;color:var(--ink)">→</span></div>"""


def k_cta(d: dict, w: int, h: int) -> str:
    return f"""<div class="grid"></div>{head(d)}
    <div class="main">
      <div style="font-size:{d.get("title_size", 110)}px;font-weight:800;letter-spacing:-5px;line-height:1.04">{rich(d["title"])}</div>
      <div style="margin-top:40px;font-size:46px;font-weight:500;line-height:1.4;color:var(--muted)">{rich(d.get("body", ""), False)}</div>
      <div style="margin-top:70px" class="pill"><span style="padding:30px 0 30px 48px">{WA.format(s=66, c="#fff")}</span><span style="font-size:56px;padding:30px 52px 30px 0">{PHONE}</span></div>
      <div style="margin-top:34px;font-size:36px;font-weight:600;color:var(--muted)">azmindigital.com · Dubai</div>
    </div>
    <div class="foot"><span>{html.escape(d.get("foot", "Save · Share with a business owner"))}</span><span>📌</span></div>"""


def k_offer(d: dict, w: int, h: int) -> str:
    items = "".join(f'<div style="display:flex;gap:22px;align-items:center;padding:22px 0;border-top:2px solid var(--line);font-size:46px;font-weight:700">'
                    f'<span style="width:58px;height:58px;border-radius:29px;background:#fff;color:#0062F5;display:grid;place-items:center;font-size:34px">✓</span>{html.escape(i)}</div>' for i in d.get("items", []))
    return f"""<div class="grid"></div>{head(d)}
    <div class="main">
      <div class="chip">{html.escape(d.get("kicker", "STARTER COMBO"))}</div>
      <div style="margin-top:36px;font-family:Serif;font-style:italic;font-size:96px;line-height:1">from</div>
      <div style="font-size:250px;font-weight:900;letter-spacing:-14px;line-height:.9"><span style="font-size:96px;letter-spacing:-3px">AED </span>{html.escape(str(d.get("price", 999)))}</div>
      <div style="margin-top:40px">{items}</div>
    </div>
    <div class="foot" style="color:var(--ink)"><span class="pill" style="padding:18px 34px;font-size:36px">{WA.format(s=44, c="#fff")} {PHONE}</span><span>azmindigital.com</span></div>"""


def k_story(d: dict, w: int, h: int) -> str:
    return f"""<div class="grid"></div>{head(d)}
    <div class="main">
      {f'<div class="chip">{html.escape(d["kicker"])}</div>' if d.get("kicker") else ""}
      <div style="margin-top:50px;font-size:{d.get("title_size", 120)}px;font-weight:800;letter-spacing:-5px;line-height:1.04">{rich(d["title"])}</div>
      {f'<div style="margin-top:50px;font-size:50px;font-weight:500;line-height:1.4;color:var(--muted)">{rich(d["body"], False)}</div>' if d.get("body") else ""}
      <div style="display:flex;gap:24px">{"".join(f'<div style="margin-top:44px;background:var(--ink);color:var(--bg);border-radius:999px;padding:26px 60px;font-size:60px;font-weight:800">{html.escape(o)}</div>' for o in d.get("options", []))}</div>
      {f'<div style="margin-top:70px;font-size:44px;font-weight:700">{rich(d["cta"], False)}</div>' if d.get("cta") else ""}
    </div>"""


def k_work(d: dict, w: int, h: int) -> str:
    img = "data:image/png;base64," + base64.b64encode((ROOT / d.get("image", "brand/portfolio/msjtechnicaluae-mobile.png")).read_bytes()).decode()
    return f"""<div class="grid"></div>{head(d)}
    <div style="position:absolute;left:80px;right:80px;top:200px">
      <div class="chip">{html.escape(d.get("kicker", "OUR WORK"))}</div>
      <div style="margin-top:30px;font-size:96px;font-weight:800;letter-spacing:-4px;line-height:1.04">{rich(d["title"])}</div>
    </div>
    <div style="position:absolute;left:50%;top:500px;width:450px;margin-left:-225px;height:920px;border-radius:64px;background:#0B1220;padding:18px;box-shadow:0 50px 100px rgba(0,0,0,.3);transform:rotate(-3deg)">
      <div style="width:100%;height:100%;border-radius:54px;overflow:hidden;background:#fff"><img src="{img}" style="width:100%"></div>
    </div>
    <div style="position:absolute;left:80px;right:80px;bottom:360px;text-align:center;font-size:40px;font-weight:700">{rich(d.get("cta", ""), False)}</div>"""


KINDS = {"cover": k_cover, "point": k_point, "cta": k_cta, "offer": k_offer, "story": k_story, "work": k_work}


def render(spec_path: Path) -> list[Path]:
    from playwright.sync_api import sync_playwright

    from agent.creatives.render import _browser

    spec = yaml.safe_load(spec_path.read_text())
    out_dir = spec_path.with_suffix("")
    out_dir.mkdir(parents=True, exist_ok=True)
    made = []
    with sync_playwright() as p:
        browser = _browser(p)
        for d in spec["designs"]:
            w, h = SIZES[d.get("size", "story" if d["kind"] in ("story", "work") else "portrait")]
            css = CSS % {"f": FONTS.as_uri(), "w": w, "h": h}
            page = browser.new_page(viewport={"width": w, "height": h})
            page.set_content(f'<html><head><style>{css}</style></head><body class="{d.get("theme", "paper")}">{KINDS[d["kind"]](d, w, h)}</body></html>')
            page.wait_for_timeout(300)
            target = out_dir / f'{d["name"]}.jpg'  # Instagram publishing accepts JPEG only
            page.screenshot(path=str(target), type="jpeg", quality=95)
            page.close()
            made.append(target)
        browser.close()
    return made


if __name__ == "__main__":
    for path in render(Path(sys.argv[1]).resolve()):
        print(path.relative_to(ROOT))
