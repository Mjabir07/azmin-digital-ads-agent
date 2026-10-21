# Receipt creative: ad copy (AED 999 Starter Combo)

Creative files: `marketing/creatives/receipt-999/` (spec `marketing/creatives/receipt-999.yaml`).
Trend: "what AED X gets you" / receipt reveal (Reels, Oct 2026). Claims only from `config/packages.yaml`.

| Placement | File |
| --- | --- |
| Facebook + Instagram Feed (4:5) | `receipt-portrait.png` |
| Stories (9:16, static) | `receipt-story.png` |
| Reels / Stories video (9:16, 11 s, no sound; add Meta's free music in Ads Manager) | `receipt-reel.mp4` |
| **Explainer reel** (9:16, 33 s, motion graphics + female voice-over, no music) | `receipt-explainer.mp4` |

## Primary text (English)
For UAE business owners 👇
Here's exactly what AED 999 gets your business:
✅ Professional business website
✅ Mobile-friendly design + WhatsApp chat button
✅ Domain name + 1 year hosting FREE
⚡ Ready in as little as 1 day
Fixed price. No hidden costs. Chat with us on WhatsApp to start.

## Headline
Your business website: AED 999

## Description
Domain + 1 year hosting included

## Call to action
Send WhatsApp message

## Pre-filled WhatsApp message
Hi! I have a business and I'm interested in the AED 999 website.

## Organic caption (Instagram / Facebook post)
What does AED 999 get a UAE business? 🧾 The full receipt 👆 Website, domain, 1 year hosting, WhatsApp button, ready in as little as 1 day. Chat with us on WhatsApp.
#DubaiBusiness #UAEBusiness #WebsiteDesign #SmallBusinessUAE #DubaiStartup #AzminDigital

## Explainer reel (33 s): what happens on screen
Rendered with Remotion (`reels/src/ExplainerReel.tsx`, composition `ExplainerReel`):
1. 0–4 s **Hook:** "What does AED 999 get a UAE business?" with the price counting up from 0.
2. 4–9 s **Problem:** a Google search types "website designer near me"; "No website? They choose someone else."
3. 9–17 s **Receipt:** prints line by line, FREE badges pop, the total counts to AED 999, "ALL INCLUDED" stamp.
4. 17–24 s **Our work:** msjtechnicaluae.com and purepreciousjewellery.com in floating phones.
5. 24–29 s **3 steps:** share details → we design → you go live; "Ready in as little as 1 day".
6. 29–32 s **CTA:** logo, AED 999, domain + 1 year hosting, pulsing "Chat on WhatsApp".
Re-render: `cd reels && npm ci && npx remotion render src/index.ts ExplainerReel out/explainer.mp4 --codec=h264 --crf=20`

### Voice-over script (AI voice, Kokoro-82M "af_heart", Apache-2.0, free for commercial use)
1. "What does nine hundred and ninety-nine dirhams get your business?"
2. "Today, customers Google you first. No website? They choose someone else."
3. "Here's the receipt. A professional website, mobile-friendly, with a WhatsApp button. Your domain, and one year of hosting, free."
4. "And these are real websites we built for UAE businesses."
5. "Just three simple steps, and you're ready in as little as one day."
6. "Message us on WhatsApp today."
Audio files: `reels/public/vo/explainer-1.wav` … `explainer-6.wav`. Add quiet background music (Meta Sound Collection
or Instagram's commercial library) at about 15–20% volume so the voice stays clear.
