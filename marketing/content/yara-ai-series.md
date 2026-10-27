# "AI Tools with Yara": reach-first series (started Mon 26 Oct 2026)

> **26 Oct update:** Jabir moved the start to **today, Mon 26 Oct**; the earlier week-2 posts were cancelled so the
> page focuses on Yara episodes. Calendar dates below are one week later than reality: **subtract 7 days**
> (week 1 = 26 Oct – 1 Nov). Daily Yara clips: `marketing/flow/daily-shots.md` (already re-dated).

Approved by Jabir 26 Oct 2026: English, presented by Yara; our own comment → DM automation;
Malayalam series later with Jabir's own avatar and voice.

## Why
Reach is now the main goal of the page. A big, active audience:
- makes every ad and post cheaper to grow,
- is proof we can show clients ("we grew our own page to X"),
- later carries digital products (guides, skill packs, templates) to an **international** audience,
  not only the UAE.

Reference format: @vibha.in.progress (Vibha). Her Claude/SEO reel got 6.1K likes and 21.3K comments,
driven by "Comment SEO and I'll send you the guide". We copy the format, never her content.

## The formula (every series reel)
1. **Hook in 1.5 s:** Yara + a big title. A curiosity line, never clickbait we can't deliver.
2. **Value in 3 steps:** Yara, then a screen demo we animate in Remotion (real commands, real results).
3. **CTA:** "Comment WORD and I'll send you the free guide" + "Follow for daily AI tips".
4. **Guide:** a 1–2 page AZMIN-branded PDF (`marketing/guides/`), sent automatically by DM.
   The last line of each guide links back to our services (website, AI automation).

## Daily system
| Slot (Dubai) | What |
| --- | --- |
| 10:00 AM | Story: poll / quiz / "comment WORD" reminder / behind the scenes |
| **7:30 PM** (Sat/Sun 12:30 PM) | **1 reel every day** (the series) |
| + 2 per week | Carousel (AI news of the week, weekly recap): saves and shares |
| 1 per week | Business post (AED 999 offer, our work), so the page still sells |
7:30 PM Dubai = 9 PM India, 3:30 PM UK, 11:30 AM New York: a good slot for an international mix.

## How every reel is made (no Flow; decided by Jabir 26 Oct)
All videos are built fully in Claude Code, at no cost per video:
| Part | Tool |
| --- | --- |
| Script | `reels/scripts/<ep>.yaml` (one line per scene; `say:` for pronunciation) |
| Yara's voice | `uv run --group voice python -m agent.voice.tts reels/scripts/<ep>.yaml` (Kokoro-82M, voice `af_heart`, free, Apache-2.0) |
| Yara on screen | **voice-host badge** (face in a ring that pulses with her voice + live waveform); big badge on the CTA. Jabir 26 Oct: focus on full motion + Yara's voice; add a real talking clip (Flow or other) to the hook only when one exists (`talkingClip` prop) |
| Real footage | full-page captures of real websites (Playwright) scrolled inside a phone, e.g. skills.sh |
| Screen demos, titles, effects | Remotion (`reels/src/YaraTutorialV3.tsx` = current template: colourful scenes, stickers, whip transitions, flashes, confetti), skills `remotion-best-practices`, `playwright-recording` (real screen recordings), `ffmpeg` |
| Captions | word-by-word karaoke from the voice timings |
| Sound | our own beat, SFX and risers (`reels/public/sfx/synth.py`, `make.sh`), so no licences needed |
| Render | `cd reels && npx remotion render src/index.ts <Composition> ../marketing/reels/<file>.mp4` |
Optional upgrade: ElevenLabs voice (skill `text-to-speech`) needs an API key and a paid plan for commercial use.
**Daily Yara clips (from 26 Oct):** a second Google account has **50 free Flow credits a day**, enough for 2 clips:
an opening (-H) and an ending (-E) where Yara really talks, with a new outfit, place and mood every day.
Clip list: `marketing/flow/daily-shots.md`; Claude in Chrome prompt: `marketing/flow/DAILY-INSTRUCTION.md`.
The clips arrive via the Telegram bot; the agent cuts them into the motion edit (`talkingClip` for the hook).
Days without clips still post: full motion + Yara's voice. The old weekly Flow shot list (W03) is no longer used.


## Episode template v4 (from Ep 1, 26 Oct) — calmer, clearer, up to 59 s
Jabir 26 Oct: v3 felt too fast to follow. Aim for **45–59 s**, one idea per screen.

| Time | Part | What's on screen |
| --- | --- | --- |
| 0–8 s | **Yara opening (Flow clip -H)** | Yara talking; big hook title appears word by word over her; episode tag "AI TOOLS WITH YARA · EP 01" |
| 8–10 s | **Series sting** | 1.5 s logo/series animation + signature sound (same every episode = recognisable) |
| 10–15 s | **Why it matters** | one bold statement card or real footage (e.g. the #1 row on skills.sh) |
| 15–45 s | **3 steps, ~10 s each** | "STEP 1/2/3" card (1 s) → demo (real website capture, terminal, chat) held long enough to read → one key takeaway line |
| 45–51 s | **Result / proof** | what you get, our real work |
| 51–59 s | **Yara ending (Flow clip -E)** | Yara's CTA + big "Comment WORD 👇" sticker + guide preview |

**Pacing rules:** voice speed 0.95 · each screen ≥ 2.5 s · new elements appear one at a time (≥ 0.6 s apart) ·
key text stays 1.5 s after it's spoken · smooth 0.5 s slide/zoom transitions (no constant flashes) ·
max 2 stickers on screen · captions: 3 words, big, high contrast · music lower under the voice.
**Look (Jabir 26 Oct: premium, natural, on-brand, no stray colours):** AZMIN Editorial only: paper cream `#F4F1EA`,
ink, navy, brand blue `#0062F5`, cyan `#00D2E2` as the single accent; Inter Tight + *Instrument Serif italic* accent
words on a blue marker; faint grid lines; series sting on cream paper. Template: `reels/src/YaraEpisode.tsx`.
**Thumbnails / reel covers:** `reels/src/YaraThumb.tsx` (Still `YaraThumb`): a frame of Yara from that day's Flow clip
(different outfit, place, expression every episode) + "EP 0X" + topic title with a serif accent + series mark; text
inside the centre 1080x1350 for the grid crop. Queue key `cover:` sets the Instagram reel cover.

## Follow + Comment in every episode (Jabir 27 Oct, no exceptions)
Every reel asks for **both** a follow and a keyword comment, in three places:
1. **Yara says it** in the ending clip (-E): "Follow AZMIN Digital and comment WORD, and I'll send you …".
2. **On screen** in the ending: the "Comment WORD 👇" sticker and the "+ Follow @azmin_digital for daily AI tips" sticker.
3. **In the caption**: a "💬 Comment WORD …" line and a "➕ Follow @azmin_digital …" line.
Every episode gets a keyword and a guide, news and recap days included (Ep 4 NEWS = the 3 links, Ep 7 TIPS = the
5 tips in one PDF). `tests/test_series_cta.py` blocks a Yara queue item whose caption misses either ask.

## Rules (on top of `azmin-brand`)
- Say "Claude", "ChatGPT" etc. in words only: no logos, no implied partnership, no competitor bashing.
- Every AI update/news item comes from a real, dated source, checked the day it is posted.
- Screen demos show real commands and real results, recorded or rebuilt from a real run.
- Prices and service claims only from `config/packages.yaml`. Yara never claims to be a real person or client.
- Comment → DM sends only the approved fixed message + guide link (one private reply per comment).

## Weekly routine
- **Sun:** trend-scout + AI news research → next week's scripts + Flow shot list → Jabir runs the Flow session.
- **Mon–Tue:** I edit the reels (Remotion), make guides, queue everything → previews to Telegram for ✅.
- **Daily:** Jabir answers DMs/comments the automation doesn't cover (questions, leads) within an hour.
- **Fri:** weekly numbers: reach, plays, comments, saves, shares, follows, DMs, WhatsApp chats.

## Month 1 calendar (2 Nov – 29 Nov)
Format A/B/C as above. **WORD** = comment keyword (each has a guide).

### Week 1 (2–8 Nov) — Flow shot list W03 (`marketing/flow/shotlist-current.md`)
| Day | Reel (7:30 PM; Sat/Sun 12:30) | Format | Comment | Extra |
| --- | --- | --- | --- | --- |
| Mon 2 | **Ep 1: find-skills, teach Claude new skills in seconds** | motion + voice | SKILL | |
| Tue 3 | We made our reels with code: behind the scenes (Remotion) | C | CODE | UAE Flag Day post 12:30 |
| Wed 4 | Make Claude write in *your* brand voice | B | BRAND | |
| Thu 5 | AI news of the week (3 real updates) | C | NEWS | News carousel |
| Fri 6 | 3 jobs to hand to AI in a small business this week | A | AUTO | |
| Sat 7 | One video → five posts: let AI do the boring part | B | REUSE | |
| Sun 8 | Weekly recap: 5 AI tips from this week | C | TIPS | Recap carousel; AED 999 offer story |

### Week 2 (9–15 Nov)
| Day | Reel | Format | Comment |
| --- | --- | --- | --- |
| Mon 9 | My 3 favourite Claude skills for marketing | A | SKILLS3 |
| Tue 10 | Comment → DM automation: how we built ours | C | AUTO-DM |
| Wed 11 | Your website in the age of AI search (get found by ChatGPT and Google) | B | AISEO |
| Thu 12 | AI news of the week | C | — |
| Fri 13 | An AI WhatsApp assistant answering at 2 AM (our service) | A | BOT |
| Sat 14 | 1 prompt that writes a week of captions | B | PROMPT |
| Sun 15 | Recap + "Ask Yara anything about AI" | C | ASK |

### Week 3 (16–22 Nov)
| Day | Reel | Format | Comment |
| --- | --- | --- | --- |
| Mon 16 | Build a website section with AI in 60 seconds (+ why a pro still matters) | A | SITE |
| Tue 17 | Free AI tools for small businesses (only tools we tested) | C | TOOLS |
| Wed 18 | Stop writing emails from scratch: AI email templates | B | EMAIL |
| Thu 19 | AI news of the week | C | — |
| Fri 20 | Myth vs truth: "AI will replace my business" | A | — |
| Sat 21 | Turn customer questions into an FAQ page with AI | B | FAQ |
| Sun 22 | Recap + our month in numbers (real reach numbers) | C | — |

### Week 4 (23–29 Nov)
| Day | Reel | Format | Comment |
| --- | --- | --- | --- |
| Mon 23 | AI agents explained in 30 seconds | A | AGENT |
| Tue 24 | Behind the scenes: how Yara is made (AI presenter, honest) | C | YARA |
| Wed 25 | GITEX (7–11 Dec) countdown: is your business ready online? | B | GITEX |
| Thu 26 | AI news of the week | C | — |
| Fri 27 | Automate follow-ups so no lead goes cold | A | FOLLOW |
| Sat 28 | 5 AI mistakes small businesses make | B | MISTAKES |
| Sun 29 | Month recap + UAE National Day (2 Dec) teaser | C | — |

## Later (month 2+)
- **Digital products:** paid "AI for small business" guide pack, Claude skill packs (brand voice, social, SEO),
  Notion/Sheets templates; sold through a checkout like Gumroad or Lemon Squeezy (Jabir decides).
- **Malayalam series** with Jabir's own avatar and voice (native-checked scripts).
- **Boost** the best-performing reel each week with a small budget (within `config/limits.yaml`, Jabir approves).
- **Case study for clients:** monthly reach screenshot + growth chart for sales calls.

## KPIs (check every Friday)
Reach, plays, 3-second hold rate, comments (keyword), saves, shares, follows, DMs sent by the automation,
WhatsApp chats. Week 1 baseline vs current page; aim to beat the previous week every week.
