---
name: social-strategy
description: AZMIN DIGITAL Instagram + Facebook growth strategy — content pillars, daily posting system (1 feed post/reel + 1 story every day), formats, hooks, captions, hashtags, stories, engagement routine, growth levers, KPIs and the monthly calendar. Use when planning content, writing captions, choosing what to post next, reviewing performance or asked how to grow the pages.
---

# Social growth strategy (Instagram first, Facebook mirrors it)

Load `azmin-brand` (claims, voice, never-list) and `trend-scout` (trend ideas) alongside this.
Current plan: `marketing/content/30-day-plan.md` (day 1 = Sun 18 Oct 2026).
**From Mon 2 Nov 2026 the goal is reach first** (approved by Jabir 26 Oct): a daily reel series "AI Tools with Yara"
for an international audience, with comment → DM guides. Plan, formats, Flow credit budget and calendar:
`marketing/content/yara-ai-series.md` (it replaces days 16–30 of the 30-day plan; sales posts continue weekly). Queue: `marketing/queue/` (publisher posts after ✅ in Telegram).

## Goal for month 1 (18 Oct – 16 Nov 2026)
Build a trusted-looking, active page fast so ads and WhatsApp leads convert better:
**30 feed posts + 30 stories**, profile looks full and professional, first organic leads in DMs/WhatsApp.
Be honest with the owner: organic growth from a new page is gradual — consistency + reels + a small boost
on the best post is what makes it "fast". No follower buying, follow/unfollow, engagement pods or bots — ever.

## Daily system
| Slot | What | Time (Dubai) |
| --- | --- | --- |
| Feed | 1 reel OR carousel OR single post (mix below) | 7:30 PM (Sat/Sun 12:30 PM) |
| Story | 1–3 frames: the day's story theme + share of today's feed post | 10:00 AM |
| Jabir, 15 min | reply to every comment/DM within 1 h; 10 genuine comments on UAE small-business accounts | evening |

Weekly mix (7 feed posts): **3 reels** (2 Yara + 1 motion) · **3 carousels** · **1 single post**.
Reels bring new people (reach); carousels get saves/shares (algorithm signal + trust); posts carry the offer.

## Feed theme — "AZMIN Editorial" (every post follows it)
One recognisable look so the grid always looks planned and premium (renderer: `agent/creatives/editorial.py`,
specs in `marketing/posts/`; reels use the same look in their end cards and stickers).
- **Palette:** paper cream `#F4F1EA` + ink `#0B0B0C` (default), navy `#071A3D` (CTA slides, teasers),
  brand blue `#0062F5` (offer posts, accent marker). WhatsApp green only on the number pill.
- **Type:** Inter Tight 800, tight tracking, for headlines; *Instrument Serif italic* for 1–2 accent words
  on a blue marker (write `*word*` in specs). Never more than 2 accents per design.
- **Every design:** logo dot + "azmindigital" header top-left, slide counter top-right in serif italic,
  faint 120 px grid lines, footer line ("swipe →", "Save this", site).
- **Grid rhythm (3 columns):** keep a repeating pattern so any screenshot of the profile looks designed:
  Yara reel (people, warm) → cream carousel cover → navy/blue post or motion reel. Avoid two navy tiles
  side by side; at least one face (Yara) in every row of three.
- **Sizes:** feed 1080×1350 (4:5) — keep text inside the centre 1080×1080 so the grid crop never cuts it;
  stories/reels 1080×1920 with 250 px top / 340 px bottom kept clear for app buttons.
- **Reel covers:** a frame where Yara faces the camera + short headline in the same type (set `cover` /
  `thumb_offset` in the queue item).
- **Research first:** each week starts with `trend-scout` (Google Trends, news, Instagram scout report);
  topics and hooks come from that research and the calendar, never random.

## Content pillars (share of feed posts)
1. **Educate (35%)** — practical tips owners can use today: website must-haves, Google Business Profile,
   WhatsApp replies, business email, ad mistakes. Format: carousel / Yara reel.
2. **Proof & process (20%)** — real work (msjtechnicaluae.com only), our 4-step process, behind the scenes,
   "how a site is built". Never invent results or testimonials.
3. **Offer (20%)** — Starter Combo AED 999 (domain + 1 yr hosting, ready in as little as 1 day), the 4 services.
   Max 1 hard offer every 3 days.
4. **Trend & entertain (15%)** — Yara in trending formats (me vs me, documentary, POV), news bridges (trend-scout).
5. **Trust & community (10%)** — founder story (Jabir), FAQs, UAE moments (Flag Day, National Day), polls.

## Formats & production (all free)
| Format | How it's made | Cost |
| --- | --- | --- |
| Yara reel | Flow clips (Claude in Chrome) → `YaraReel`-style edit in `reels/` (AvatarReel sets) | ~60 Flow credits |
| Motion reel | Remotion kinetic type + MSJ site + Pixabay stock (`CreatorReel`/`TrendReel` styles) | 0 |
| Carousel (5–8 slides) | HTML templates → PNG 1080×1350 (`agent/creatives/render.py`) | 0 |
| Single post / story | Same renderer (4:5 post, 9:16 story) | 0 |
Flow budget: ≤ 2 Yara reels/week (~120 credits) + ~40 credits B-roll → fits the ~1,050 monthly credits.

## Hooks (first 1.5 s / first slide)
Patterns: "Stop doing X", "3 signs…", "Your customers do this before they call you", "Myth: … Truth: …",
"POV: …", "I asked 10 Dubai businesses…" (only if real), a number ("2 AM", "1 day", "AED 999").
Slide 1 of a carousel = hook only, big type; last slide = save/share + WhatsApp CTA.

## Caption formula
Line 1 hook (≤ 125 chars, repeats the video hook) → 2–4 short lines of value → 1 CTA
("Save this", "Send to a business owner", "WhatsApp +971 56 724 7597") → keyword line for Instagram search
(e.g. "website design Dubai · AI chatbot UAE") → 5–8 hashtags → music credit if our licensed track is used.
Hashtag sets (rotate, never more than 8): core `#DubaiBusiness #SmallBusinessUAE #DigitalAgencyDubai`
+ service set — web `#WebsiteDesign #WebDesignDubai`, AI `#AIAutomation #WhatsAppChatbot`,
marketing `#DigitalMarketingUAE #MetaAds`, email `#BusinessEmail #GoogleWorkspace`.
Always add location "Dubai, United Arab Emirates" when posting in-app; Facebook gets the same caption.

## Stories (daily themes)
Mon **poll** · Tue **share today's post** · Wed **quiz / this-or-that** · Thu **behind the scenes** ·
Fri **quick tip** · Sat **our work** · Sun **DM prompt** ("Reply WEB for the AED 999 details").
Interactive stickers (poll, quiz, question, link) can't be added through the API: the agent posts the story
design; Jabir adds the sticker in the app (10 s) on poll/quiz days — the Telegram preview says so.
Save good stories to Highlights: Services · Work · Offer · FAQ · Contact.

## Growth levers (month 1)
1. Consistency — never miss a day (queue ≥ 5 days ahead).
2. Reels with strong hooks; repost every reel to Story with a "new reel 👆" sticker.
3. Saves/shares — carousels with genuinely useful checklists.
4. Instagram SEO — name/bio keywords (done), keywords in captions, alt text.
5. Engagement routine (Jabir 15 min) — the #1 free lever for a new account.
6. Collab post with MSJ Technical (only with their permission) to reach their audience.
7. Small boost: once a post beats the page average on saves/shares, recommend boosting it
   (AED 20–30/day × 3–5 days, UAE, 25–55, business owners). Needs Jabir's approval like any spend.
8. Pin 3 posts: offer, best reel, "what we do".

## KPIs (review every Sunday — Instagram Insights / Meta Business Suite)
Followers (+ growth), accounts reached, reel views & avg watch time, saves, shares, profile visits,
website taps, WhatsApp clicks, DMs, leads. Month-1 healthy signals for a new local B2B page:
reach growing week on week, saves+shares ≥ 3% of reach on carousels, ≥ 3 WhatsApp/DM leads.
Double down on the top 3 posts' topics/format; drop formats that are bottom-3 two weeks in a row.

## Compliance (always)
Brand rulebook claims only · no fake reviews or invented stats · no personal-attribute targeting language ·
no conflict/politics/religion topics · licensed music only (reels/MUSIC.md; trending audio only added
in-app by Jabir from the Commercial Audio library) · AI presenter Yara is never presented as a customer.
