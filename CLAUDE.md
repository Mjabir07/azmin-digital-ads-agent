# AZMIN DIGITAL Ads Agent — project brief for Claude Code

## What this project is
An AI marketing agent for **AZMIN DIGITAL** (owner: Jabir, Dubai, timezone Asia/Dubai) that runs
Meta (Facebook/Instagram) Click-to-WhatsApp ads selling **website design services** to small
businesses in the UAE (Month 1) and KSA (Month 2+).

The full marketing strategy is in `docs/PLAYBOOK.md`. The system design is in `docs/SPEC.md`.
Setup steps for the owner are in `docs/SETUP.md`. Read all three before writing code.

## The owner
- Jabir is **new to coding and to Meta ads**. Explain each step in plain English, one step at a time.
- Before running any command that installs software, spends money, or changes live ads, say what it
  does and ask for confirmation.
- **Cloud-only setup:** Jabir does not keep files on his PC. The code lives in a GitHub repo,
  Claude Code works in cloud sessions, and everything runs on GitHub Actions or a cloud host.
  Never ask him to run commands on his own computer; do it in the session or via GitHub's web UI.

## Hard safety rules (never break these)
1. **Never spend money or change live ads without human approval.** The agent may *recommend*
   pausing an ad or changing a budget; a human approves in Telegram/WhatsApp/email before the API
   call is made. Exception: none in Phase 1.
2. **Daily budget ceiling:** never set any ad set above AED 150/day or the account above
   AED 300/day, even if approved. Raise this only if Jabir edits `config/limits.yaml` himself.
3. **Budget changes max +20% at a time**, no more than once every 72 hours per ad set.
4. **No edits in the first 72 hours** after an ad set launches (learning phase).
5. **Secrets** (Meta tokens, WhatsApp tokens, API keys) live only in **GitHub Secrets** (and the
   cloud host's secret settings), never in code, logs, commits or chat output. `.env` is in
   `.gitignore` and only for local testing inside a cloud session.
6. **WhatsApp:** the AI assistant only talks about AZMIN DIGITAL's website services, never invents prices
   (prices come from `config/packages.yaml`), and hands the chat to Jabir when the lead asks for a
   call, a custom quote, or is upset. Respect Meta's WhatsApp Business messaging and AI policies.
7. **Personal data** of leads (name, phone) stays in the lead store; never send it to third-party
   services other than the ones listed in SPEC.md.

## Optimisation rules the agent applies (from PLAYBOOK §8)
- Ad spent ≥ AED 60 with 0 conversations → recommend **pause**.
- Ad cost per conversation ≥ 2× its ad set average after ≥ AED 80 spend → recommend **pause**.
- Ad set frequency > 3 over 7 days → recommend **new creatives**.
- Ad set under target cost per conversation (AED 25) for 7 days → recommend **+20% budget**.
- Many chats but < 15% qualify → flag **offer/targeting problem**.
- Qualified leads but < 5% close → flag **sales process problem**.

## Tech choices (default — confirm with Jabir before changing)
- Python 3.12, `uv` for env/deps, package name `agent` (daily entry point `python -m agent.daily`).
- Storage: **Google Sheets** (tabs: `metrics`, `leads`, `actions_log`) so Jabir can see everything;
  no local database files. Move to a hosted Postgres (e.g. Supabase) only if Sheets gets too slow.
- Scheduling: **GitHub Actions** cron (`.github/workflows/daily-report.yml`), secrets in GitHub Secrets.
- Phase 3 webhook: FastAPI on a small cloud host (Render, Railway, Fly.io or Google Cloud Run).
- Meta Marketing API + WhatsApp Cloud API via plain `httpx` calls (pin the Graph API version in `.env`).
- Claude API (Anthropic SDK) for analysis, report writing, ad-copy ideas and the WhatsApp assistant.
- Reports delivered by email or Telegram bot (owner picks in SETUP).

## Build order
Build in the phases in `docs/SPEC.md`. Finish, test and demo each phase to Jabir before starting
the next. Write tests for the rules engine. Use a `--dry-run` flag on anything that would call a
write endpoint.

## Lead Agent (live, separate from the ads agent) — `lead-agent/`
Finds international website clients (interior designers and clinics in UK, UAE, Canada,
Germany, Qatar). It runs entirely in Google Sheets / Apps Script, not GitHub Actions.
- Google Sheet "AZMIN Leads" + Apps Script `lead-agent/apps-script/Code.gs`. Jabir pastes the
  file into Extensions → Apps Script; after any change, send him the file, tell him to re-paste
  it, then run the menu item that applies the change (e.g. "Rewrite all draft messages").
- Keys live in Apps Script → Project Settings → Script properties, never in chat or code:
  `TOMTOM_API_KEY` (leads, free, no card), `TAVILY_API_KEY` (web search that confirms
  "no website" leads, 1,000 free/month, `TAVILY_DAILY_LIMIT` 30/day), `GOOGLE_API_KEY`
  (PageSpeed only, no billing). Jabir has no card Google Cloud accepts: prefer no-card services.
- No-website leads first; "No website" only after a domain guess AND a web search find no own
  site, otherwise "Unverified" / "Check manually". Sites get PageSpeed → Hot / Warm / Low.
- Drafts: short, no client-site list, no delivery time, link to azmindigital.com; opt-out line for
  UK/Canada; Germany = no cold email (call/LinkedIn). Nothing is ever sent automatically.
- Setup and daily routine: `lead-agent/SETUP.md`. Deep research on demand: the `lead-scout`
  sub-agent in `.claude/agents/lead-scout.md`.

## Branches
`main` is the finished version (scheduled workflows run from it). Do work on a branch named
`feature/…`, `fix/…` or `content/…` (or the chat's `claude/…` branch) and merge it into `main`
when it's tested.
