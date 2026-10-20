# AZMIN DIGITAL Lead Agent

Finds international clients for AZMIN DIGITAL: **interior designers and clinics** in the
**UK, UAE, Canada, Germany and Qatar**. Two parts that work together:

| Part | What it does | Where |
|---|---|---|
| **Lead engine** (Google Sheet + Apps Script) | Every day: finds businesses with the free TomTom Search API (OpenStreetMap as backup, Google Places optional), checks each website (loads? HTTPS? mobile speed), scores Hot / Warm / Low, finds the public contact email, drafts a personal first message, tracks follow-ups, optional Telegram summary. | [`apps-script/Code.gs`](apps-script/Code.gs) · setup in [`SETUP.md`](SETUP.md) |
| **Lead Scout** (Claude Code sub-agent) | On demand: deep research on a market or on Hot leads from the sheet: reviews the site, checks email setup (SPF/DMARC), writes a sharper message (German version for Germany), and returns a table to paste back into the sheet. | [`.claude/agents/lead-scout.md`](../.claude/agents/lead-scout.md) |

Nothing is ever sent automatically. Jabir reviews every message and sends it himself.

## Using Lead Scout

In a Claude Code session on this repo, ask for example:

- "Use lead-scout to find 10 interior designers in Manchester."
- "Use lead-scout on these Hot leads from my sheet: (paste rows)."
- "Use lead-scout to write LinkedIn notes for the Berlin clinics in my sheet."

## Cost

Free, no credit card: Apps Script, the TomTom Search API (2,500 requests a day) and the
PageSpeed Insights API are all free. Google Places is optional and needs billing.
