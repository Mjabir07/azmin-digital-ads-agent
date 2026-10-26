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

## Lead Finder (moved to its own repo)
The Google Sheet lead agent and the lead-scout sub-agent now live in
`Mjabir07/azmin-lead-finder`, with their own chat. Don't change them from this repo.

## Third-party skills (installed with `npx skills`, versions in `skills-lock.json`)
- `remotion-best-practices` (remotion-dev): use when building or editing reels in `reels/`.
- `social` (coreyhaines31/marketingskills): hooks, captions, carousels and reel scripts.
- `find-skills` (vercel-labs): search skills.sh for new skills; read a skill fully before adding it.
- `playwright-recording`, `ffmpeg` (digitalsamba video toolkit): real screen recordings and media prep for reels.
- `text-to-speech` (ElevenLabs): only if Jabir adds an ElevenLabs key. Default voice is free Kokoro (`agent/voice/tts.py`).
Reels are built fully in code (no Flow): see "How every reel is made" in `marketing/content/yara-ai-series.md`.
Our own `azmin-brand`, `social-strategy` and the hard safety rules above always win over these
(prices and claims only from `config/packages.yaml`; nothing is posted without Jabir's ✅).
Update them with `npx skills update -p` on a `feature/…` branch.

## Branches
`main` is the finished version (scheduled workflows run from it). Do work on a branch named
`feature/…`, `fix/…` or `content/…` (or the chat's `claude/…` branch) and merge it into `main`
when it's tested.
