# AZMIN DIGITAL Ads Agent — system spec

## Goal
Turn Meta ad spend into paying website clients with as little manual work as possible, while a
human approves every money decision.

## Architecture

```
            ┌──────────────── Meta Marketing API ────────────────┐
            │  insights (spend, CPM, CTR, conversations, freq)   │
            │  ad / ad set status + budget (write, approved only)│
            └───────────────▲──────────────────────┬─────────────┘
                            │ daily pull           │ approved actions
   ┌───────────────┐   ┌────┴──────────────────────┴────┐   ┌──────────────────┐
   │ WhatsApp Cloud│──▶│  Core app (Python)              │──▶│ Owner channel    │
   │ API webhook   │   │  - metrics store (G.Sheets)     │   │ Telegram / email │
   │ (lead chats)  │◀──│  - rules engine (PLAYBOOK §8)   │◀──│ approve / reject │
   └───────────────┘   │  - Claude: reports, copy, chat  │   └──────────────────┘
                       │  - lead tracker (+ Google Sheet)│
                       └─────────────────────────────────┘
```

## Phases

### Phase 1 — Reporting agent (read-only) · build first, ~2–3 days
- `ads/fetch_insights.py`: pull yesterday + last-7-days insights at ad, ad set and campaign level
  (spend, impressions, CPM, CTR, frequency, `messaging conversations started`, cost per conversation).
- Store in the Google Sheet `metrics` tab (no local files).
- Runs daily on GitHub Actions (`.github/workflows/daily-report.yml`).
- `rules/engine.py`: apply the CLAUDE.md optimisation rules → list of recommendations.
- `report/daily.py`: Claude writes a short plain-English report (what happened, what to do, why).
- Deliver at 09:00 Asia/Dubai via Telegram or email.
- Needs only a **read** token (`ads_read`).

### Phase 2 — Lead tracker + approvals · ~3–4 days
- Lead table: date, name, phone, business, ad/ad set source, status
  (New → Qualified → Quote sent → Won/Lost), quote AED, won AED.
- Optional sync to Google Sheets.
- Approval flow: each recommendation becomes a Telegram message with Approve / Reject buttons;
  on Approve the app calls the Marketing API (pause ad / change budget) within the limits in
  `config/limits.yaml`. Every action is logged in `data/actions_log`.
- Weekly Monday report: cost per qualified lead, cost per client, ROI, best hook, 2 new ad-copy
  ideas in English + Arabic.

### Phase 3 — WhatsApp AI assistant · ~1–2 weeks
- WhatsApp Cloud API webhook (FastAPI) receives incoming chats from Click-to-WhatsApp ads
  (the referral payload tells which ad the lead came from).
- Claude-powered assistant follows the PLAYBOOK §6 script: greet, ask the 3 qualifying questions
  one at a time, share portfolio links, recommend one package from `config/packages.yaml`.
- Hands off to Jabir (notify + stop auto-replying) on: call request, custom quote, complaint,
  low confidence, or any message after the 3 questions are answered.
- Writes each lead into the lead table with ad attribution.
- Note: moving a number to the Cloud API changes how the WhatsApp Business app works on it.
  Check Meta's current "coexistence" option before migrating Jabir's main number; otherwise use a
  second number for the API.

### Phase 4 — Dashboard (optional)
- Simple web page: spend, conversations, qualified leads, clients, cost per client, by week and by ad.

## Config files
- `config/limits.yaml` — budget ceilings, max step %, cool-down hours.
- `config/packages.yaml` — package names, inclusions, prices (owner-edited only).
- `config/targets.yaml` — target CPM, cost per conversation, qualification rate.

## Required credentials (`.env`)
See `.env.example`. Obtained in `docs/SETUP.md`.

## Testing
- Unit tests for the rules engine with fixture insight data.
- `--dry-run` on every write call; default ON until Jabir turns it off.
