---
name: meta-ads
description: AZMIN DIGITAL Meta (Facebook/Instagram) Click-to-WhatsApp ads — audience and location targeting for real UAE business owners, lead-quality filters, campaign structure, budgets and safety limits, ad copy, launch via agent/ads/launch.py with Telegram approval, daily optimisation rules. Use when planning, building, launching, reviewing or optimising ads, or when lead quality is poor.
---

# Meta ads — qualified WhatsApp leads, not just cheap chats

Load `azmin-brand` first (claims, prices, never-list). Hard rules live in CLAUDE.md and `config/limits.yaml`:
the agent builds campaigns **PAUSED**; Jabir activates with ✅ in Telegram; never above AED 150/day per ad set or
AED 300/day account; budget steps max +20% every 72 h; no edits in the first 72 h (learning phase).

## Goal & KPIs (config/targets.yaml)
Cost per conversation ≤ AED 25 · qualified rate ≥ 15% of chats · close rate ≥ 5% of qualified.
Optimise for **qualified** conversations (owner/decision-maker with a real business and a near-term need),
not for the cheapest chat.

## Lead quality — the levers that work (and are allowed)
Meta forbids targeting or excluding people by ethnicity, nationality, religion or similar personal traits,
and ad copy must not call those out. Never try to "exclude a community". Filter by **intent and business
signals** instead; this is what actually removes unwanted chats:
1. **Who:** business-owner signals: behaviours "Small business owners" and "Facebook Page admins" (Business Page
   admins); interests Entrepreneurship, Small business, Startup company, E-commerce, Digital marketing,
   Online advertising. Age 27–55. Resolve IDs with `agent/ads/launch.py --resolve` (they change).
2. **Where:** people **living in** the area (location type `home`, not "recently in", which removes tourists and
   visitors). Month 1: Dubai, Sharjah, Abu Dhabi, Ajman. Later, a radius test on business districts
   (Business Bay, Deira, Al Quoz, JLT, Mussafah, Sharjah Industrial) for B2B services.
3. **Language:** English + Arabic locales (only include; Meta has no language exclusion).
4. **Placements:** Facebook + Instagram Feed, Stories and Reels only. No Audience Network, no Messenger inbox
   (Audience Network is a main source of accidental, low-quality clicks).
5. **Creative pre-qualifies:** say who it's for in line 1 ("For UAE business owners…"), show the real offer
   (AED 999, domain + hosting), show real work (MSJ). Clarity repels time-wasters.
6. **Pre-filled message sets the frame:** "Hi! I have a business and I'm interested in the AED 999 website."
7. **WhatsApp qualifying flow (Jabir / later the AI assistant):** greeting asks 3 things: business name and
   activity · do you have a website now? · when do you need it? Mark each chat Qualified / Not a fit in the
   `leads` sheet. That data drives the funnel rules (qualified < 15% means fix the offer or targeting).
8. **Exclude** people who already messaged us (custom audience) once we have 100+ chats.
If chats are mostly unqualified after AED 150 spend: tighten (switch Advantage+ ad set to original audience,
raise min age to 30, keep owner behaviours only, strengthen line 1 of copy). Never use protected traits.

## Campaign structure (spec: marketing/ads/<campaign>.yaml)
- Objective **OUTCOME_ENGAGEMENT**, conversion location **WhatsApp**, goal **maximise conversations**,
  ad-set budgets (no CBO) so the two audiences get a fair test.
- Ad set **A, "Owners (strict)":** owner behaviours + interests, Advantage audience OFF.
- Ad set **B, "Advantage+ (owner hints)":** Advantage+ audience with the same interests as suggestions,
  age min 27 as a hard control.
- 3–4 ads per ad set, same ads in both: offer reel (Yara), myth/debate reel, offer image, 3-signs carousel.
  Feed 4:5, Stories/Reels 9:16. CTA "Send WhatsApp message".
- Test budget: AED 37.50 per ad set per day (AED 75/day) for 4 days, the approved launch plan in docs/LAUNCH.md.

## Workflow
1. Write/adjust the spec in `marketing/ads/`. Run `uv run python -m agent.ads.launch marketing/ads/<spec>.yaml`
   (dry run: validates limits, resolves targeting IDs, prints the full plan, changes nothing).
2. `--build` creates everything on Meta **PAUSED** (no spend) and queues an "activate" item: Jabir gets the plan
   in Telegram with ✅ Activate / ❌ Reject. Only ✅ makes the API call that sets it ACTIVE (publisher job).
3. Days 1–3: hands off. Daily report (agent/daily.py) applies the CLAUDE.md optimisation rules and only
   *recommends* pause/scale; each change is a new Telegram approval.
4. Day 4: decide with docs/LAUNCH.md table. Winners → +20% steps; losers → new creatives from the content system.

## Copy rules
Benefit first, then proof, then the CTA. Line 1 names the audience. Never imply knowledge of personal traits
("Are you Bengali?", "Struggling with money?"). No guarantees, no fake urgency, no competitor names. Prices
only from config/packages.yaml. Arabic ads only after a native-speaker check.

## MCP / plugins
Not needed. The agent calls the Marketing API directly with the system-user token in GitHub Secrets.
Third-party "Meta Ads MCP" servers would require sending that token to someone else's server (CLAUDE.md rules
5 and 7), so don't use them.
