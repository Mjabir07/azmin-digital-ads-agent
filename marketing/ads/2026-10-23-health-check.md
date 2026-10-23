# Meta Ads health check — 23 Oct 2026

Account `act_1642058000807528` · Campaign "AZD | UAE | WhatsApp Leads | Website Design" (Click-to-WhatsApp,
objective Engagement → maximise conversations) · 1 ad set "Owners strict | 27-55", lifetime AED 200,
19 Oct 08:00 → 23 Oct 08:00 Dubai. Data: `ads-diagnose` run of 23 Oct, 12:11 Dubai (campaign lifetime, read-only).

> **Small sample warning:** 4 conversations in total. Treat every split below as a direction to test,
> not a proven result. Nothing in this report was changed in Meta.

## Meta Ads Health Score: 42/100 (Grade D, "Poor")

```
Tracking & lead signal: 35/100  ███▌░░░░░░  (30%)
Creative:               35/100  ███▌░░░░░░  (30%)
Account structure:      45/100  ████▌░░░░░  (20%)
Audience & placements:  60/100  ██████░░░░  (20%)
```
Adapted to Click-to-WhatsApp: the "Pixel/CAPI" pillar is scored on the lead signal Meta and we get back from
WhatsApp, since there is no website purchase event to track.

## Results (campaign lifetime, both campaigns)

| Metric | Value | Target / benchmark | Status |
| --- | --- | --- | --- |
| Spend | AED 138.98 (new campaign AED 118 of AED 200 budget) | AED 200 | ⚠️ underspent |
| Impressions / reach freq. | 5,265 · frequency 1.41 | < 3 | ✅ |
| CPM | AED 26.4 | ≤ AED 35 | ✅ |
| Link clicks / CTR | 20 · **0.38%** | ≥ 1.2% good, < 0.7% poor | ❌ |
| WhatsApp conversations | 4 (5 messaging connections) | 10+ in 4 days | ❌ |
| Cost per conversation | **AED 35** | ≤ AED 25 | ❌ (was AED 23 on 21 Oct) |
| Conversations after 21 Oct | **0** from ~AED 45 spend | — | ❌ |

## Findings

### 1. Tracking & lead signal (35/100)
| Check | Status | Note |
| --- | --- | --- |
| Messaging conversation events reported | ✅ PASS | `messaging_conversation_started_7d`, first reply, depth 2–3 all reported. |
| Lead store / qualification tracking | ❌ FAIL (High) | `GOOGLE_SHEET_ID` not set: nobody records which chats were real prospects, so the "<15% qualify" rule can't run. |
| Lead-quality signal back to Meta | ❌ FAIL (High) | Meta optimises for *any* conversation. Sending "Lead / Qualified" events from WhatsApp (Conversions API for Business Messaging, or labelling chats in WhatsApp Business) lets it find people who actually buy. |
| Website pixel on azmindigital.com | ❓ Not checked | Needed later for retargeting site visitors. |
| AI daily report | ⚠️ WARNING | `ANTHROPIC_API_KEY` not set, so it uses the simple template. |

### 2. Creative (35/100)
| Check | Status | Note |
| --- | --- | --- |
| CTR ≥ 1% | ❌ FAIL (High) | 0.38%: the ads don't stop the scroll. |
| ≥ 3 formats live | ❌ FAIL | Only 1 image + 1 video, and Meta gave the video 7% of spend (AED 9.44). In practice it's a 1-ad test. |
| ≥ 3–5 creatives per ad set | ❌ FAIL | 2 (plan was 4: carousel, pain reel, audit, new-biz). |
| Creative fatigue | ✅ PASS | Frequency 1.41, no fatigue. CTR was 0.5% → 0.4% but sample too small to call it decline. |
| Video length for Reels ≤ 15 s | ⚠️ | New explainer is 33 s: fine for Feed/organic; for Reels ads use the 11 s `receipt-reel.mp4` or a cut-down. |
| Safe zones / brand claims | ✅ PASS | All creatives use approved claims only. |
| New creatives ready, not live | ⚠️ | Receipt set (portrait, story, 11 s reel, 33 s explainer) is ready in `marketing/creatives/receipt-999/`. |

**Andromeda diversity score: 4/10 (MEDIUM clustering risk).**
Concept 1 (both = "AED 999 website", one with a myth angle) · Format 1 (image + video) · Visual 1 (same navy
brand look) · Hook 0 (one video) · Headline 1. Adding the receipt set lifts this to about 6/10; adding a
real-person/UGC-style video (Jabir or Yara talking) and the audit offer would reach 8/10.

### 3. Account structure (45/100)
| Check | Status | Note |
| --- | --- | --- |
| Campaign is running | ❌ FAIL (Critical) | Ad set end date passed (23 Oct 08:00 Dubai). **Ads are no longer delivering.** |
| Consolidated structure | ✅ PASS | 1 campaign, 1 ad set; old test campaign paused. |
| Learning phase | ❌ FAIL | ~1 conversation/day vs ~50/week needed to exit learning; the ad set never left learning. |
| Budget vs target cost | ⚠️ WARNING | AED 50/day = 2× the AED 25 target (aim for ≥ 5×, i.e. AED 125/day, which is under your AED 150 cap but a big jump; see plan). |
| Budget delivery | ⚠️ WARNING | Spent AED 118 of 200: the narrow "strict owners" audience limited delivery. |
| A/B audience test (ad set B, Advantage+) | ❌ Not built | Planned in the meta-ads skill, never launched. |

### 4. Audience & placements (60/100)
| Check | Status | Note |
| --- | --- | --- |
| Frequency < 3 | ✅ PASS | 1.41. |
| Residents only (location type "home") | ✅ PASS | Some spend leaked to RAK/UAQ/Fujairah (AED 0.64), negligible. |
| Placements, Facebook Reels | ✅ Best | 3 of 4 chats, **AED 18/chat**. |
| Placements, Facebook Feed | ⚠️ | 1 chat, AED 48/chat. |
| Placements, Instagram (feed + reels + stories) | ❌ | **AED 33.80, 0 chats, 2 clicks.** |
| Age 25–34 | ✅ Best | 3 chats, **AED 17/chat** (note: targeting starts at 27). |
| Age 35–44 | ⚠️ | 1 chat, AED 54/chat. |
| Age 45–55 | ❌ | AED 31.55, 0 chats (highest CTR 0.7% though; people click but don't message). |
| Advantage+ audience tested | ❌ | Not tested yet. |
| Regions | ❓ | Meta doesn't report chats by region; Dubai takes 46% of spend. |

## Rule check (CLAUDE.md §Optimisation rules)
- Offer-Image: AED 108.82, 4 chats, AED 27/chat (ad set avg ≈ AED 30): no pause rule triggered.
- MeVsMe-Reel: AED 9.44, 0 chats: under AED 60, no rule triggered (never got a fair test).
- Frequency 1.41 < 3: no "new creatives" trigger from fatigue; the trigger here is low CTR.
- No ad set has 7 days under target: no budget increase.

## Action plan (nothing changes until Jabir approves in Telegram)

**Quick wins**
1. **Decide on the next test now**: the campaign has ended. LAUNCH.md day-4 table says "very few conversations
   (cost > AED 25–40)" → new creatives + test again.
2. **Set up the leads sheet** (`GOOGLE_SHEET_ID` + service account in GitHub Secrets) and mark each chat
   Qualified / Not a fit. Without it we can't tell good chats from time-wasters.
3. **Ask the 4 people who messaged** for follow-up (Day 3 / Day 7 messages, PLAYBOOK §6).

**Next test (proposal, AED 200–300 over 5–7 days, within limits)**
| Change | Why |
| --- | --- |
| New campaign, 2 ad sets: A "Owners strict" vs B "Advantage+ audience, age 25–45" | Strict audience under-delivered; test broad with creative doing the targeting (Andromeda). |
| Placements: Facebook + Instagram **Reels & Stories + Facebook Feed**; drop Instagram Feed | IG Feed: AED 16, 0 clicks. Keep IG Reels one more round (only AED 15.61 so far). |
| Ages 25–45 | 25–34 best; 45+ clicks but doesn't message. |
| 4 ads, each a different concept: receipt reel (11 s) · receipt image · Offer-Image (current winner) · free website audit | Diversity 4/10 → ~7/10; a fair test because each ad set gets the same 4. |
| Budget AED 40/day per ad set (AED 80/day), no end date, review on day 5 | Under the AED 150 / 300 caps; enough to give each ad set ~10 chats at target cost. |
| Ice-breakers unchanged; keep the "Just checking prices" button | It's the quick filter for low-intent chats. |

**Later (after 20+ chats logged)**
- Send "qualified lead" events back to Meta (Conversions API for Business Messaging) and test optimising for leads.
- Exclude people who already messaged (custom audience) once there are 100+ chats.
- Add a talking-head video (Jabir or Yara) as the 5th concept.

Sources: `ads-diagnose` log (GitHub Actions run 39922934852), `marketing/ads/2026-10-uae-website-leads.yaml`,
`config/limits.yaml`, `config/targets.yaml`, `docs/LAUNCH.md`.
