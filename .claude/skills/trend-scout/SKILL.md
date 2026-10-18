---
name: trend-scout
description: Find what is trending (Google Trends UAE/KSA, Dubai news & events, Instagram Reels formats via Claude in Chrome) and turn it into on-brand AZMIN DIGITAL reel/post ideas and Yara scripts. Use when planning the weekly content batch, or when asked for trending, viral or news-jacking content.
---

# Trend scout — trends → AZMIN content

Load the `azmin-brand` skill first. Every idea must still sell one of our 4 services with approved claims only.

## 1. Gather (every week, ~10 min)
1. **Search trends:** `uv run python -m agent.research.trends` → `marketing/research/trends/<date>-google-trends.md`.
2. **News & events:** web-search Dubai/UAE business, tech and AI news of the last 7 days, plus events in the
   next 30 days (Dubai event calendar, DWTC/Expo City, GITEX — Dec 2026, Ramadan/Eid/National Day 2 Dec,
   back-to-school, Dubai Shopping Festival).
3. **Instagram formats & audio:** read the latest `marketing/research/trends/*-instagram.md` written by Claude in
   Chrome (instruction: `marketing/flow/TREND-SCOUT-INSTRUCTION.md`). If none is newer than 7 days, ask Jabir to run it.

## 2. Filter (drop the trend if ANY is true)
- Tragedy, accident, death, war, politics, religion, crime, health scare, or anything about a private person.
- Sports match results / celebrity gossip with no natural business bridge.
- We would need another brand's logo, product footage, music or trademark to make it work.
  We MAY mention a public news topic in words ("a new electric car launched this week…"), but never use the
  brand's logo/footage, never imply partnership or endorsement, never mock competitors.
- Copyrighted trending songs: never in ads; for organic posts only via Instagram's in-app Commercial Audio
  library added by Jabir at posting time. Our renders use licensed music (reels/MUSIC.md).

## 3. Bridge (the creative step)
Find the honest link between the trend and a real customer problem we solve. Patterns that work:
- **"Everyone's talking about X → here's what it means for your business"** (AI news → WhatsApp chatbot).
- **"X happened → your customers do the same with you"** (car launch → people check the website before buying).
- **Event countdown** (GITEX / DSF / National Day → "will your business be ready online?").
- **Trending FORMAT, our message** (Netflix-documentary narration, "me vs me" debate, POV, one-take skit,
  "things I'd never do as a business owner", list of 3).

Score each idea 1–5 on: relevance to UAE SME owners, brand safety, bridge strength, novelty. Keep only ≥ 16/20.

## 4. Output
Write `marketing/content/<week>-trend-ideas.md` with 3–5 ideas, each:
- Trend + source + date, bridge in one line, format, service promoted, score.
- **Yara script**: exactly 3 clips, each ≤ 18 spoken words (fits 8 s), last clip = WhatsApp CTA.
- On-screen pop-ups per clip (stickers, counters, site shots), caption draft (≤ 125 chars first line),
  5–8 hashtags, and the music credit line.
Then add the chosen idea's clips to `marketing/flow/shotlist-current.md` (Shot IDs `Wxx-Yn`) and render with
the `YaraReel` composition once clips arrive. Trends expire fast: aim to post within 3–5 days.
