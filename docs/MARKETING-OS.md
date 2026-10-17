# AZMIN Marketing OS — the agentic marketing plan

*Prepared 2026-10-17. A full-automation system where agents plan, create, publish, run ads and
report — and Jabir monitors, approves with one tap, and handles leads.*

---

## Decisions (Jabir, 2026-10-17)
- **Approval:** weekly batch — one Telegram tap approves the week. Revisit full auto after 2–3 good weeks.
- **LinkedIn:** apply for LinkedIn's Community Management API (free). Facebook + Instagram go live first; LinkedIn joins when approved.
- **Reels:** fully AI-made (motion graphics, AI b-roll, AI voice) — no founder filming.
- **Budget: FREE tools only.** Only costs: Claude Pro subscription + Meta ad budget. Every paid tool below is
  replaced by the free stack in §0.

## 0. The free stack (replaces all paid tools — decision 2026-10-17)

| Need | Free tool | Notes |
| --- | --- | --- |
| Agent "brain" (planning, writing, reviewing) | **Claude Code with your Claude Pro plan**, run as scheduled routines | No paid API key. Weekly content batch is created in a Claude session |
| Daily report text | Built-in template report (already works without a Claude API key) | Claude-written version only if you add a paid API key later |
| Scheduling / running jobs | **GitHub Actions** | Free minutes (private repo: 2,000 min/month — enough) |
| Posting to Facebook + Instagram | **Meta Graph API** | Free, already connected ✅ |
| Posting to LinkedIn | LinkedIn Community Management API | Free; waiting for approval |
| Designs | Our brand renderer (HTML/CSS → PNG) | Free, already built ✅ |
| Photos & b-roll video clips | **Pexels / Pixabay** free APIs | Free for commercial use, no attribution required |
| **Premium AI video clips** | **Google Flow (Veo)** — included in Jabir's Gemini Pro (~1,050 credits/month) | No API: agent writes the weekly shot list → Jabir generates clips in Flow (~10–15 min/week, Fast mode, watermark off) → sends them to the Telegram bot → agent edits them into reels |
| Motion graphics reels | **Remotion** + ffmpeg | Remotion is free for individuals/companies up to 3 people |
| Voiceover | **Kokoro TTS** (open-source, Apache-2.0) | Runs inside GitHub Actions, natural English voices |
| *(not used)* ElevenLabs free plan | — | Free plan is non-commercial and needs attribution, so not suitable for business reels |
| Captions | **faster-whisper** (open-source) | Word-timed animated captions |
| Music | **YouTube Audio Library / Pixabay Music** | Royalty-free, commercial use allowed |
| Public links for Instagram reels | A separate **public** GitHub repo for published media | Instagram's API needs a public video URL; only already-public content goes there |
| Approvals & reports | Telegram bot | Free ✅ |
| Content calendar, leads | Google Sheets | Free |

Paid tools mentioned later in this document (fal.ai, ElevenLabs, posting services, Claude API) are **optional
upgrades only** — not used unless Jabir decides otherwise.

## 1. The idea in one picture

```
            ┌────────────────────────── MONDAY: STRATEGIST AGENT ──────────────────────────┐
            │ reads last week's results + competitors + trends → writes the week's plan    │
            └──────────────────────────────────────┬───────────────────────────────────────┘
                                                   ▼
  ┌──────────────┐   ┌────────────────┐   ┌────────────────┐   ┌──────────────────┐
  │ COPYWRITER   │──▶│ DESIGN STUDIO  │──▶│ REEL STUDIO    │──▶│ QUALITY CHECKER  │
  │ captions,    │   │ premium posts, │   │ edited reels,  │   │ brand, spelling, │
  │ hooks, EN/AR │   │ carousels      │   │ voice, captions│   │ Meta policy      │
  └──────────────┘   └────────────────┘   └────────────────┘   └────────┬─────────┘
                                                                         ▼
                                     📱 TELEGRAM: Jabir taps ✅ Approve / ✏️ Change
                                                                         ▼
  ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────────┐
  │ PUBLISHER            │   │ ADS MANAGER          │   │ LEADS                    │
  │ schedules FB, IG,    │   │ launches/pauses ads  │   │ WhatsApp AI assistant,   │
  │ LinkedIn at best time│   │ ONLY after approval  │   │ hands hot leads to Jabir │
  └──────────┬───────────┘   └──────────┬───────────┘   └────────────┬─────────────┘
             └───────────────────────────┴──────────────┬────────────┘
                                                        ▼
                               ANALYST AGENT: daily report 9 AM, weekly review
                               (what worked → feeds next Monday's plan)
```

**Jabir's job:** ~10 minutes a day — approve the content batch, glance at the 9 AM report, reply to hot leads.

## 2. What can be fully automatic — honestly

| Task | Automatic? | Notes |
| --- | --- | --- |
| Research, content plan, captions, hashtags | ✅ Fully | Agent does it weekly |
| Premium designs (posts, carousels, stories) | ✅ Fully | Brand engine + AI imagery |
| Reels editing (motion graphics, voiceover, captions, music) | ✅ Fully | Remotion + AI video + AI voice |
| Publishing & scheduling to **Facebook + Instagram** (posts, reels, stories) | ✅ Fully | Official Meta API, free |
| Publishing to **LinkedIn company page** | ⚠️ Needs a route | LinkedIn requires partner approval (weeks). Interim: a publishing service that already has it (see §6) |
| Replying to comments / DMs | ✅ With rules | Simple replies auto; anything sales-related goes to Jabir |
| **Ads: create, budget, pause** | 🔐 Approval required | Your safety rule (CLAUDE.md): money moves only after you tap Approve. Caps: AED 150/ad set, AED 300/account, +20% max |
| Filming real-life footage | ❌ Needs you | Best-performing reels show a real person. 1 short phone clip a week from you → agent edits it |

**Approval mode:** start with *"approve each weekly batch"* (one tap for the whole week). After 2–3 good weeks you can
switch organic posts to *"auto-publish, tell me after"*. Ads stay on approval.

## 3. Strategy — world-class, not random posting

**Positioning:** *"One team for websites, AI automation, marketing and business email — built to bring you customers."*
Proof-driven, premium look, UAE-local, English first (Arabic once a native reviewer is in place).

**5 content pillars**
| Pillar | Purpose | Examples |
| --- | --- | --- |
| 1. Proof | Trust | Client website reveal reels (MSJ), before/after, results |
| 2. AI demos | "Wow" + differentiation | Screen-record a WhatsApp chatbot answering at 2 AM; lead auto-follow-up demo |
| 3. Education | Reach & saves | "3 reasons your site loses customers", "Why your emails land in spam" |
| 4. Offers | Leads | AED 999 website combo, free audit, free email setup check |
| 5. Founder | Human trust | Jabir on camera 20–30 s: tips, behind the scenes, client stories |

**Weekly rhythm (per platform)**
| Platform | Volume | Format |
| --- | --- | --- |
| Instagram + Facebook | 3 reels + 2 carousels/posts + 5–7 stories | Same content, adapted crop/caption |
| LinkedIn (page + Jabir's profile) | 3 posts | Founder voice, B2B insights, case studies, carousels as PDF |
| Ads (Meta, Click-to-WhatsApp) | Always-on | 1 campaign per service once websites prove out; best organic reels get boosted |

**Premium creative standard** (what the Quality Checker enforces)
- First 1.5 seconds = hook (motion + bold text); captions burned in (most watch muted); 9:16 safe zones respected.
- Real proof over stock: client sites, real dashboards, real chats (with permission / anonymised).
- One idea per post; brand colours/fonts only; no fake reviews, no guaranteed results, no unconfirmed prices.

## 4. The premium creative engine

| Layer | Tool | Why |
| --- | --- | --- |
| Layouts, brand system | Our renderer (HTML/CSS → PNG), upgraded to v2 templates | Pixel-perfect brand consistency, already built |
| Photoreal scenes, mockups | AI image models via **fal.ai** (Flux, Imagen, Ideogram for text) | One account, pay-per-image, premium quality |
| Reels motion graphics | **Remotion** (+ official `remotion-dev/skills`) | Agency-grade animation coded by the agent — kinetic type, device mockups, transitions |
| AI b-roll clips | Veo / Kling / Runway (via fal.ai) | Cinematic shots without filming |
| Voiceover | **ElevenLabs** | Natural EN (and later AR) voices |
| Captions | Whisper (word-level timing) → animated captions in Remotion | The "premium reel" look |
| Music | Meta Sound Collection at posting time, or a licensed library | Avoid copyright takedowns |
| Optional design canvas | **Canva** connector (Claude) | If you want to tweak a design by hand |

## 5. Claude setup — skills, plugins, connectors (MCP)

**Plugins (Anthropic Directory — install in Claude):**
- **Marketing** (by Anthropic) — campaign planning, content, brand voice, competitor tracking, reporting.
- **Design** (by Anthropic) — design critique and design-system consistency.
- **Social Media Skills** (community, 106 skills) — platform growth, hooks, reels, publishing, analytics playbooks.

**Agent skills:**
- `remotion-dev/skills` — official Remotion best practices for video (`npx skills add remotion-dev/skills`).
- Anthropic `skills` repo — `brand-guidelines`, `canvas-design` (premium static design patterns).
- **Custom AZMIN skills we will write** (in this repo, `.claude/skills/`):
  `azmin-brand` (voice, colours, rules, approved prices/claims), `content-calendar`, `reel-director`
  (hook → beats → captions → CTA), `meta-policy-check`, `weekly-review`.

**Connectors / MCP servers:**
| Connector | Use | Status |
| --- | --- | --- |
| Meta Ads (Meta's official Ads MCP, or Pipeboard) | Read ads data, prepare changes for approval | Add when ads start |
| GitHub | Code, content storage, scheduling (Actions) | ✅ in use |
| Google Sheets / Drive | Content calendar, leads, metrics | Set up with service account |
| Canva (optional) | Manual design edits | Optional |
| Playwright | Screenshots of client sites | ✅ in use (via Actions) |
| Telegram bot | Approvals + reports to your phone | To build |

## 6. Publishing — how posts actually go out

- **Facebook + Instagram:** direct **Meta Graph API** (free). Posts, carousels, reels and stories, scheduled at best times.
  Needs a Meta developer app with `pages_manage_posts` + Instagram content-publishing permissions for *your own* Page.
- **LinkedIn:** two choices —
  1. *Apply* for LinkedIn's Community Management API (free, but approval takes weeks and needs a verified Page).
  2. *Use a unified posting service* that already has LinkedIn approval (e.g. Zernio, Blotato, Publora, Buffer-type tools,
     typically ~$20–50/month — compare current prices). Fastest; the agent posts through its API.
  **Recommendation:** start with option 2, apply for option 1 in parallel, switch later if you want to drop the fee.

## 7. Build roadmap

| Week | Build (agent) | You do (Jabir) |
| --- | --- | --- |
| **1 — Foundations** | Brand skill, content-calendar sheet, Telegram approval bot, Meta app + publishing code | Create Meta developer app (I guide), Telegram bot (2 min), pick LinkedIn route, install the 3 plugins |
| **2 — Premium engine v2** | Remotion reel templates (hook/reveal/demo/tip), fal.ai imagery, ElevenLabs voice, caption system | Sign up fal.ai + ElevenLabs, add keys as GitHub Secrets; record 2 short phone clips |
| **3 — Autopilot** | Weekly batch: plan → create → QC → Telegram approve → auto-schedule FB/IG/LinkedIn; first 2 weeks of content | Approve first batch, give feedback |
| **4 — Ads + analytics** | Ads manager with approvals (Phase 2), daily/weekly reports, boosting best organic reels | Add Meta ads token, approve first campaign |
| **Month 2** | Self-learning loop (results → next plan), WhatsApp AI assistant (Phase 3), Arabic content once reviewed | Handle leads, close clients |

## 8. Monthly running cost (approximate — check current prices)

| Item | Cost |
| --- | --- |
| Claude Pro (you already have it) | Your existing subscription |
| All tools in §0 | **Free** |
| **Ads budget (separate)** | AED 75/day to start = ~AED 2,250/month |
| *Optional later upgrades* (Claude API, fal.ai, ElevenLabs) | Only if you choose |

## 9. Safety rules that never change
- No money moves without your approval; budget ceilings stay in `config/limits.yaml`.
- No invented prices, fake reviews, guaranteed results, or client work shown without permission.
- All keys live in GitHub Secrets only.
