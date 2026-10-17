"""Render ad posters (PNG) and a short reel (MP4) from a creative spec.

    uv run --group creatives python -m agent.creatives.render marketing/creatives/launch-v1.yaml

The spec lists each creative's template, size, language and text. Output goes next to the
spec in a folder of the same name, plus `contact-sheet.png` showing everything at once.
Nothing here talks to Meta: Jabir reviews the files and decides what to upload.
"""

from __future__ import annotations

import html
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

from agent.config import ROOT

HERE = Path(__file__).resolve().parent
SIZES = {"square": (1080, 1080), "portrait": (1080, 1350), "story": (1080, 1920), "cover": (1640, 624)}

# Simple line icons (drawn for this project).
ICONS = {
    "check": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    "phone": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
    "chat": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>',
    "bolt": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12l1-8z"/></svg>',
    "search": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#5B6B85" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/></svg>',
    "tag": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9-8-8z"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>',
    "star": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    "globe": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
    "bot": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4.5M9 13.5h.01M15 13.5h.01M9.5 17h5"/><circle cx="12" cy="3.5" r="1"/></svg>',
    "chart": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M6 16l4-5 3 3 5-7"/><path d="M14 7h4v4"/></svg>',
    "mail": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
    "arrow": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "arrow_left": '<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
}


def icon(name: str, size: int = 64) -> str:
    return ICONS[name].format(s=size)


def esc(text) -> str:
    """Escape text; **bold** marks emphasis and newlines become line breaks."""
    parts = html.escape(str(text)).split("**")
    return "".join(f'<span style="color:var(--blue)">{p}</span>' if i % 2 else p for i, p in enumerate(parts)).replace("\n", "<br>")


def brand(dark: bool) -> str:
    return (
        f'<div class="brand"><img src="{(ROOT / "brand/logo.png").as_uri()}" alt="">'
        f'<div class="name">AZMIN <span>DIGITAL</span></div></div>'
    )


_SCREENSHOT: str | None = None  # set per creative from the spec's `phone_screenshot`


def phone(scale: float = 1.0, style: str = "") -> str:
    if _SCREENSHOT:
        screen = f'<div class="status-bar"></div><img class="shot" src="{_SCREENSHOT}" alt="">'
    else:  # generic sample site
        screen = """
  <div class="site-nav"><div class="site-logo">Your <b>Business</b></div><div class="burger"></div></div>
  <div class="site-hero"><div class="t">Your business,<br>online in style</div><div class="s">Dubai · Sharjah · Abu Dhabi</div></div>
  <div class="site-btn">Chat on WhatsApp</div>
  <div class="site-grid"><div class="site-card"><i></i><u></u><u></u></div><div class="site-card"><i></i><u></u><u></u></div>
  <div class="site-card"><i></i><u></u><u></u></div><div class="site-card"><i></i><u></u><u></u></div></div>
  <div class="site-line"></div><div class="site-line short"></div>"""
    return f'<div class="phone" style="transform: scale({scale}); {style}"><div class="screen">{screen}</div></div>'


def cta(c: dict, lang: str) -> str:
    arrow = icon("arrow_left" if lang == "ar" else "arrow", 40)
    return f'<div class="cta">{icon("chat", 46)}<span>{esc(c["cta"])}</span>{arrow}</div>'


# --- templates -------------------------------------------------------------------------------

def price_html(c: dict, lang: str, size_px: int | None = None) -> str:
    price, style = c["price"], f' style="font-size:{size_px}px"' if size_px else ""
    cur, amt = f"<small>{esc(price['currency'])}</small>", esc(price["amount"])
    # Arabic reads right-to-left: "999 درهم" puts the number first (rightmost).
    return f'<div class="big-price"{style}>{amt + cur if lang == "ar" else cur + amt}</div>'


def t_price(c: dict, lang: str, size: str) -> str:
    story = size == "story"
    side = "left" if lang == "ar" else "right"
    if story:
        visual = f'<div style="display:flex; justify-content:center; margin-top:60px; height:560px">{phone(0.75, "transform-origin: top center;")}</div>'
    else:
        visual = f'<div style="position:absolute; {side}:40px; bottom:60px">{phone(0.78, f"transform-origin: bottom {side};")}</div>'
    return f"""
<div class="canvas dark {'story' if story else ''}"><div class="shape s1"></div><div class="shape s2"></div>
  {brand(True)}
  <div class="main" style="{'' if story else 'max-width:640px'}">
    <div><div class="kicker">{esc(c['kicker'])}</div></div>
    <div style="margin-top:28px">{price_html(c, lang, 240 if story else None)}</div>
    <div class="sub" style="margin-top:18px">{esc(c['sub'])}</div>
    <div><div class="badge" style="margin-top:34px">{'<span class="tick">' + icon('check', 30) + '</span>'}{esc(c['badge'])}</div></div>
    {visual if story else ''}
  </div>
  {'' if story else visual}
  <div class="footer" style="max-width:{'100%' if story else '600px'}">
    <div><div class="footnote muted">{esc(c['footnote'])}</div>{_note_inline(c)}</div>
  </div>
</div>"""


def _note_inline(c: dict) -> str:
    note = c.get("sample_note")
    return f'<div class="footnote muted" style="font-size:18px; font-weight:400; margin-top:6px; opacity:.8">{esc(note)}</div>' if note else ""


def t_feature(c: dict, lang: str, size: str) -> str:
    kind, side = c.get("visual"), "left" if lang == "ar" else "right"
    visual, width = "", "900px"
    if kind == "phone":
        visual, width = f'<div style="position:absolute; {side}:70px; bottom:-150px">{phone(1.0)}</div>', "560px"
    elif kind == "chat":
        bubbles = "".join(f'<div class="bubble {b["side"]}">{esc(b["text"])}</div>' for b in c["chat"])
        visual = f'<div class="chat" style="margin-top:56px; max-width:860px">{bubbles}</div>'
    elif kind == "steps":
        steps = "".join(f'<div class="step"><span class="n">{i}</span>{esc(t)}</div>' for i, t in enumerate(c["steps"], 1))
        visual = f'<div class="steps" style="margin-top:48px; max-width:760px">{steps}</div>'
    return f"""
<div class="canvas light"><div class="shape s1"></div><div class="shape s2"></div>
  {brand(False)}
  <div class="main" style="max-width:{width}">
    <div class="icon-tile{' small' if c.get('icon_size') == 'small' else ''}">{icon(c['icon'], 60 if c.get('icon_size') == 'small' else 84)}</div>
    <h1 style="font-size:{c.get('title_size', 76)}px; margin-top:40px">{esc(c['title'])}</h1>
    <div class="sub muted" style="margin-top:22px; font-weight:400">{esc(c['text'])}</div>
    {visual if kind != 'phone' else ''}
  </div>
  {visual if kind == 'phone' else ''}
  <div class="footer" style="max-width:{width}">{_note_inline(c)}</div>
</div>"""


def t_cta(c: dict, lang: str, size: str) -> str:
    perks = "".join(f'<span class="perk">{esc(p)}</span>' for p in c.get("perks", []))
    return f"""
<div class="canvas dark"><div class="shape s1"></div><div class="shape s2"></div>
  {brand(True)}
  <div class="main">
    <h1 style="font-size:100px">{esc(c['title'])}</h1>
    <div class="sub" style="margin-top:28px; color:var(--cyan)">{esc(c['text'])}</div>
    <div class="perks" style="margin-top:36px">{perks}</div>
    <div style="margin-top:56px">{cta(c, lang)}</div>
  </div>
  <div class="footer"><div class="footnote muted">{esc(c['footnote'])}</div></div>
</div>"""


def t_list(c: dict, lang: str, size: str) -> str:
    story = size == "story"
    items = "".join(f'<li><span class="tick">{icon("check", 34)}</span>{esc(i)}</li>' for i in c["items"])
    k = 1.25 if story else 1.0
    return f"""
<div class="canvas light {'story' if story else ''}"><div class="shape s1"></div><div class="shape s2"></div>
  {brand(False)}
  <div class="main" style="font-size:{k}em">
    <div><div class="kicker">{esc(c['kicker'])}</div></div>
    <h1 style="font-size:{int(c.get('title_size', 104) * k)}px; margin-top:30px">{esc(c['title'])}</h1>
    <div class="sub muted" style="margin-top:24px; font-weight:400; font-size:{int(40 * k)}px">{esc(c['text'])}</div>
    <ul class="checks" style="margin-top:{int(50 * k)}px; gap:{int(22 * k)}px">{items.replace('<li>', f'<li style="font-size:{int(40 * k)}px">')}</ul>
    <div style="margin-top:{int(56 * k)}px">{cta(c, lang)}</div>
  </div>
  <div class="footer"><div class="footnote muted">{esc(c['footnote'])}</div></div>
</div>"""


def t_newbiz(c: dict, lang: str, size: str) -> str:
    story = size == "story"
    if story:
        phone_html = f'<div style="display:flex; justify-content:center; margin-top:50px; height:560px">{phone(0.75, "transform-origin: top center;")}</div>'
    else:
        phone_html = f'<div style="position:absolute; right:60px; top:330px">{phone(0.95)}</div>'
    return f"""
<div class="canvas dark nb {'story' if story else ''}"><div class="shape s1"></div><div class="shape s2"></div>
  {brand(True)}
  <div class="main" style="{'' if story else 'max-width:600px'}">
    <div><div class="kicker">{esc(c['kicker'])}</div></div>
    <h1 style="font-size:{100 if story else c.get('title_size', 84)}px; margin-top:30px">{esc(c['title'])}</h1>
    <div style="margin-top:30px">{price_html(c, lang, 190 if story else 150)}</div>
    <div class="sub" style="margin-top:12px">{esc(c['sub'])}</div>
    {phone_html if story else ''}
    <div style="margin-top:44px">{cta(c, lang)}</div>
  </div>
  {'' if story else phone_html}
  <div class="footer"><div><div class="footnote muted">{esc(c['footnote'])}</div>{_note_inline(c)}</div></div>
</div>"""


def t_scene(c: dict, lang: str, size: str) -> str:
    """Reel scene (story size)."""
    kind, body = c["scene"], ""
    if kind == "search":
        body = f"""<div class="search" style="margin-top:80px; font-size:46px">{icon('search', 60)}<span>{esc(c['query'])}</span></div>
        <div style="display:grid; gap:28px; margin-top:44px">
          <div class="result"><div class="u" style="font-size:28px">www.yourbusiness.ae</div><div class="h" style="font-size:42px">{esc(c['result'])}</div></div>
          <div class="result ghost"><div class="u" style="font-size:28px">www.another-company.ae</div><div class="h" style="font-size:42px">Another company</div></div>
          <div class="result ghost"><div class="u" style="font-size:28px">www.another-company-2.ae</div><div class="h" style="font-size:42px">Another company</div></div></div>"""
    elif kind == "phone":
        body = f'<div style="display:flex; justify-content:center; margin-top:60px; height:900px">{phone(1.2, "transform-origin: top center;")}</div>'
    elif kind == "price":
        body = f"""<div style="margin-top:80px">{price_html(c, lang, 300)}</div>
        <div><div class="badge" style="margin-top:50px; font-size:40px"><span class="tick">{icon('check', 30)}</span>{esc(c['badge'])}</div></div>"""
    elif kind == "cta":
        body = f'<div style="margin-top:80px; transform:scale(1.3); transform-origin:left center">{cta(c, lang)}</div>'
    return f"""
<div class="canvas dark story"><div class="shape s1"></div><div class="shape s2"></div>
  {brand(True)}
  <div class="main">
    <h1 style="font-size:{c.get('title_size', 120)}px">{esc(c['title'])}</h1>
    {body}
  </div>
  <div class="footer">{_note_inline(c)}</div>
</div>"""


def t_profile(c: dict, lang: str, size: str) -> str:
    """Profile picture: logo centred so it survives Instagram's circle crop."""
    return f"""<div class="canvas" style="background:#fff; display:grid; place-items:center; padding:0">
  <img src="{(ROOT / 'brand/logo.png').as_uri()}" style="width:62%; height:62%; object-fit:contain" alt=""></div>"""


def t_cover(c: dict, lang: str, size: str) -> str:
    """Facebook cover (1640x624). Key content stays in the centre ~1200px that mobile shows."""
    perks = "".join(f'<span class="perk">{esc(p)}</span>' for p in c.get("perks", []))
    return f"""
<div class="canvas dark" style="padding:0 220px; justify-content:center"><div class="shape s1"></div><div class="shape s2"></div>
  <div style="display:flex; align-items:center; justify-content:space-between; gap:40px; position:relative; z-index:2">
    <div style="max-width:760px">
      {brand(True)}
      <h1 style="font-size:64px; margin-top:28px">{esc(c['title'])}</h1>
      <div class="perks" style="margin-top:26px">{perks}</div>
    </div>
    <div style="height:520px; width:300px; position:relative">{phone(0.7, "position:absolute; right:0; top:10px; transform-origin: top right;")}</div>
  </div>
</div>"""


def t_cover_agency(c: dict, lang: str, size: str) -> str:
    """Facebook cover for the whole agency: headline + the 4 services from azmindigital.com."""
    tiles = "".join(
        f'<div class="svc"><div class="svc-icon">{icon(sv["icon"], 46)}</div>'
        f'<div><div class="svc-t">{esc(sv["title"])}</div><div class="svc-d">{esc(sv["text"])}</div></div></div>'
        for sv in c["services"]
    )
    return f"""
<div class="canvas dark" style="padding:0 200px; justify-content:center"><div class="shape s1"></div><div class="shape s2"></div>
  <div style="display:flex; align-items:center; justify-content:space-between; gap:56px; position:relative; z-index:2">
    <div style="max-width:560px">
      {brand(True)}
      <h1 style="font-size:58px; margin-top:26px">{esc(c['title'])}</h1>
      <div class="sub" style="margin-top:16px; font-size:28px; color:var(--cyan)">{esc(c['sub'])}</div>
    </div>
    <div class="svc-grid">{tiles}</div>
  </div>
</div>"""


def t_highlight(c: dict, lang: str, size: str) -> str:
    """Instagram highlight cover: one icon, centred (shown in a small circle)."""
    return f"""<div class="canvas" style="background:linear-gradient(135deg, var(--blue), var(--cyan)); display:grid; place-items:center; padding:0">
  {icon(c['icon'], 420)}</div>"""


TEMPLATES = {"profile": t_profile, "cover": t_cover, "cover_agency": t_cover_agency, "highlight": t_highlight, "price": t_price, "feature": t_feature, "cta": t_cta, "list": t_list, "newbiz": t_newbiz, "scene": t_scene}


def page(c: dict) -> str:
    global _SCREENSHOT
    shot = c.get("phone_screenshot")
    _SCREENSHOT = (ROOT / shot).as_uri() if shot and (ROOT / shot).exists() else None
    if shot and not _SCREENSHOT:
        c = {**c, "sample_note": c.get("sample_note_fallback")}  # real screenshot missing: label as sample
    lang = c.get("lang", "en")
    w, h = SIZES[c["size"]]
    body = TEMPLATES[c["template"]](c, lang, c["size"])
    css = (HERE / "style.css").as_uri()
    return f"""<!doctype html><html lang="{lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="{css}"><style>:root{{--w:{w}px;--h:{h}px}}</style></head>
<body class="{lang}">{body}</body></html>"""


def _browser(p):
    path = os.environ.get("CHROMIUM_PATH") or "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
    return p.chromium.launch(executable_path=path) if Path(path).exists() else p.chromium.launch()


def render(spec_path: Path) -> Path:
    from playwright.sync_api import sync_playwright

    spec = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
    out = spec_path.with_suffix("")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    defaults = spec.get("defaults", {})
    pngs: list[Path] = []
    css_dir = HERE  # style.css uses ../../brand paths relative to agent/creatives
    with sync_playwright() as p:
        browser = _browser(p)
        for item in spec["creatives"]:
            c = {**defaults, **item}
            w, h = SIZES[c["size"]]
            pg = browser.new_page(viewport={"width": w, "height": h})
            with tempfile.NamedTemporaryFile("w", suffix=".html", dir=css_dir, delete=False, encoding="utf-8") as f:
                f.write(page(c))
                tmp = Path(f.name)
            try:
                pg.goto(tmp.as_uri())
                pg.evaluate("document.fonts.ready")
                target = out / f"{c['id']}.png"
                pg.screenshot(path=str(target))
                pngs.append(target)
                print(f"  {target.relative_to(ROOT)}")
            finally:
                tmp.unlink()
                pg.close()
        browser.close()

    for reel in spec.get("reels", []):
        _make_reel(out, reel)
    _contact_sheet(out, pngs)
    return out


def _make_reel(out: Path, reel: dict) -> None:
    """Stitch scene PNGs into an MP4 with gentle zoom and crossfades (no audio; add music in Ads Manager)."""
    scenes, secs, fade = reel["scenes"], reel.get("seconds_per_scene", 4), 0.5
    inputs, filters = [], []
    for i, sid in enumerate(scenes):
        inputs += ["-loop", "1", "-t", str(secs), "-i", str(out / f"{sid}.png")]
        filters.append(
            f"[{i}:v]scale=1188:2112,zoompan=z='min(zoom+0.0006,1.06)':d={secs * 30}:s=1080x1920:fps=30,"
            f"trim=duration={secs},setpts=PTS-STARTPTS,format=yuv420p[v{i}]"
        )
    last, offset = "v0", secs - fade
    for i in range(1, len(scenes)):
        filters.append(f"[{last}][v{i}]xfade=transition=fade:duration={fade}:offset={offset}[x{i}]")
        last, offset = f"x{i}", offset + secs - fade
    target = out / f"{reel['id']}.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filters), "-map", f"[{last}]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(target)],
        check=True,
    )
    print(f"  {target.relative_to(ROOT)}")


def _contact_sheet(out: Path, pngs: list[Path]) -> None:
    from PIL import Image, ImageDraw

    thumb_h, pad, cols = 420, 30, 5
    thumbs = []
    for p in pngs:
        im = Image.open(p).convert("RGB")
        thumbs.append((p.stem, im.resize((int(im.width * thumb_h / im.height), thumb_h))))
    rows = [thumbs[i:i + cols] for i in range(0, len(thumbs), cols)]
    width = max(sum(t.width for _, t in r) + pad * (len(r) + 1) for r in rows)
    sheet = Image.new("RGB", (width, len(rows) * (thumb_h + 70) + pad), "#E9EEF6")
    draw = ImageDraw.Draw(sheet)
    y = pad
    for r in rows:
        x = pad
        for name, t in r:
            sheet.paste(t, (x, y))
            draw.text((x, y + thumb_h + 10), name, fill="#0B1B3A")
            x += t.width + pad
        y += thumb_h + 70
    sheet.save(out / "contact-sheet.png")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python -m agent.creatives.render <spec.yaml>")
    render(Path(sys.argv[1]).resolve())
