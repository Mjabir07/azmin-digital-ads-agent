# Launch guide — first 4-day test (for Jabir)

Approved 2026-10-15. You set this up yourself in **Meta Ads Manager**: the agent never spends
money or changes ads (CLAUDE.md rule 1). Budget: **AED 75/day** → about **AED 300 for 4 days**.

## 0. Before you start (one-time)
- [ ] **Facebook Page** for AZMIN DIGITAL, with the logo as profile picture.
- [ ] **WhatsApp Business** number connected to that Page (Page → Settings → Linked accounts → WhatsApp).
- [ ] **Business Portfolio** (business.facebook.com) with an **ad account in AED**, time zone **Asia/Dubai**.
- [ ] A **payment method** on the ad account.
- [ ] In WhatsApp Business: set a **greeting message** (from PLAYBOOK §6 step 1) and keep your phone close —
      fast replies close more leads.

## 1. Get the files onto your phone
Open the repo on GitHub → `marketing/creatives/launch-v1/` → tap a file → **Download** (⋯ menu or "Download raw").

| Ad | Files |
| --- | --- |
| Ad 1 Price carousel | `ad1-price-carousel-1.png` … `-5.png` (5 cards, in order) |
| Ad 1 story version | `ad1-price-story.png` |
| Ad 2 Pain reel | `ad2-pain-reel.mp4` |
| Ad 3 Free audit | `ad3-audit-portrait.png` + `ad3-audit-story.png` |
| Ad 4 New business | `ad4-newbiz-portrait.png` + `ad4-newbiz-story.png` |
| ~~Ad 5 Arabic~~ | On hold until a native speaker checks it |

All ad text (primary text, headline) is in `marketing/copy/launch-pack.md` — copy and paste it.

## 2. Create the campaign (Ads Manager → **+ Create**)
| Setting | Choose |
| --- | --- |
| Objective | **Engagement** |
| Campaign name | `AZD \| UAE \| WhatsApp Leads \| Website Design` |
| Advantage campaign budget | **Off** (we set budgets per ad set) |
| Special ad category | None |

## 3. Ad set A
| Setting | Choose |
| --- | --- |
| Name | `UAE \| Broad \| 25-55` |
| Conversion location | **Messaging apps → WhatsApp** (pick your number) |
| Performance goal | **Maximise number of conversations** |
| Daily budget | **AED 37.50** |
| Schedule | Start today, no end date (you'll review on day 4) |
| Locations | Dubai, Sharjah, Abu Dhabi, Ajman |
| Age | 25–55 · Audience: **Advantage+**, no interests |
| Placements | **Advantage+ placements** |

## 4. Ad set B — duplicate Ad set A, then change:
| Setting | Choose |
| --- | --- |
| Name | `UAE \| Interests \| SME owners` |
| Detailed targeting | small business owners, entrepreneurship, startups, online advertising |

## 5. Ads (create the same 4 ads in **both** ad sets — this tests which audience works better)
For every ad: Identity = your Page · Call to action = **Send WhatsApp message**.

| Ad name | Format | Media | Pre-filled message |
| --- | --- | --- | --- |
| `Price-Carousel` | Carousel | 5 cards; for Stories use `ad1-price-story.png` | Hi! I'm interested in the AED 999 website offer. |
| `Pain-Reel` | Single video | `ad2-pain-reel.mp4` (add music from Meta's library if you like) | Hi! I'm interested in the AED 999 website offer. |
| `Audit-Static` | Single image | portrait for Feed, story for Stories/Reels | Hi! I'd like the free website audit. |
| `NewBiz-Static` | Single image | portrait for Feed, story for Stories/Reels | Hi! I'm interested in the AED 999 website offer. |

Tip: in "Media", choose **"Customise by placement"** to give Stories/Reels the tall `-story` image.

Review → **Publish**. Meta reviews ads (usually minutes to a few hours).

## 6. The 4-day test
- **Days 1–3: don't touch anything.** Meta's "learning phase" needs ~72 hours; edits reset it.
- **Every morning:** the agent's report (once the GitHub Secrets are added) tells you spend,
  WhatsApp conversations and what to do. Reply to every WhatsApp chat fast, using the PLAYBOOK §6 script.
- **Log every lead** (name, business, which ad, status) — the Google Sheet `leads` tab.
- **Day 4 — decide** (about AED 300 spent):

| What you see | What it means | Next step |
| --- | --- | --- |
| Cost per conversation ≤ AED 25 and some chats are real prospects | Ads work | Keep running; agent suggests budget steps (+20% max) |
| Conversations come in but nobody is a real prospect | Offer/targeting issue | Pause the weakest ads; agent suggests changes |
| Very few or no conversations (cost > AED 40 each) | Creative or audience issue | Agent makes new creatives; test again |

**About "close 1 client in 4 days":** possible, but don't judge the ads only on that. Small businesses
often take a few days to decide. In 4 days the realistic goal is **10+ WhatsApp conversations and
2–3 serious prospects**; keep following up (Day 1 / Day 3 / Day 7 messages in PLAYBOOK §6) after the test ends.
