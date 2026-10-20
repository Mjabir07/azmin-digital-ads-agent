# AZMIN DIGITAL — client-finding agents (project memory)

Repo for AZMIN DIGITAL's sales and lead-generation agents. Owner: **Jabir**, freelance web
agency based in Dubai (website: https://azmindigital.com, repo `Mjabir07/azmin-digital-website`,
which is a separate project with its own chat).

## Working with Jabir
- New to coding: plain English, one step at a time, click-by-click for anything in a
  dashboard (Google Sheets, Apps Script, TomTom, Tavily, Google Cloud). Cloud/browser only.
- Never ask him to paste API keys into chat. Keys live in Apps Script → Project Settings →
  Script properties (or GitHub Secrets for anything on GitHub Actions).
- Nothing is ever sent to leads automatically: agents research and draft, Jabir sends.
- He has no card that Google Cloud accepts (Botim prepaid is rejected), so prefer free,
  no-card services.

## Lead Agent (live, in use) — `lead-agent/`
- Google Sheet "AZMIN Leads" + Apps Script `lead-agent/apps-script/Code.gs` (Jabir pastes
  the file into Extensions → Apps Script; after any change, send him the file and tell him
  to re-paste, then run the menu item that applies the change).
- Targets: interior designers and clinics in UK, UAE, Canada, Germany, Qatar (Config tab).
- Sources: TomTom Search API (`TOMTOM_API_KEY`, free, no card) → OpenStreetMap fallback;
  Google Places optional (needs billing, not used).
- Qualify: no-website leads first. A lead is "No website" only after the domain guess AND a
  Tavily web search (`TAVILY_API_KEY`, 1,000 free/month, `TAVILY_DAILY_LIMIT` 30/day) find
  no own site; otherwise "Unverified" / "Check manually". Sites get PageSpeed
  (`GOOGLE_API_KEY`, no billing) → Hot / Warm / Low.
- Drafts: short, no client-site list, no delivery time, link to azmindigital.com; opt-out
  line for UK/Canada; Germany = no cold email (call/LinkedIn). "Rewrite all draft messages"
  menu item rebuilds drafts after wording changes.
- Setup and daily routine for Jabir: `lead-agent/SETUP.md`.

## Lead Scout sub-agent — `.claude/agents/lead-scout.md`
On-demand deep research and sharper outreach for leads pasted from the sheet.

## Ads Agent (planned, not built yet)
`azmin-digital-ads-agent.zip` holds the original kit (CLAUDE.md, docs/PLAYBOOK.md,
docs/SPEC.md, docs/SETUP.md) for a Meta Click-to-WhatsApp ads reporting agent. Unzip and
follow its CLAUDE.md when Jabir asks to start it.
