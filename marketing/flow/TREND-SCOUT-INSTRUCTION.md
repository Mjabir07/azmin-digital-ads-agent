# Instagram trend scout — instruction for Claude in Chrome

**When:** once a week (e.g. Sunday), before the content batch. ~10 min of its time, 0 credits.
**You:** open Chrome (logged in to Instagram) → Claude side panel → paste the box below.

```
You are researching Instagram trends for AZMIN DIGITAL (a Dubai digital agency: websites, AI chatbots,
digital marketing, business email). Only LOOK — do not like, follow, comment, post or message anyone.

1. Open https://www.instagram.com/reels/ and watch/scroll about 40 reels. Then open Explore
   (https://www.instagram.com/explore/) and search these: "dubai business", "small business uae",
   "website design", "marketing tips", "ai tools", "entrepreneur dubai". Look at Top + Reels results.
2. Note the patterns you see repeatedly:
   - FORMATS (e.g. POV, "me vs me" debate, documentary narration, list of 3, before/after, one-take skit,
     green-screen reaction, text-on-screen story). For each: 1-line description + example account name.
   - HOOKS: the first sentence/text of the 10 strongest reels (exact words).
   - AUDIO: trending sounds (name + artist + approx. number of reels using it, from the audio page).
     Mark which ones are available for business accounts if Instagram shows it.
   - TOPICS: news or events people in UAE/KSA are talking about this week.
3. Write the report in this exact layout and give it to me as one text block:
   # Instagram trends — <today's date>
   ## Formats  (table: format | description | example account | why it works)
   ## Hooks    (numbered list of exact hook lines)
   ## Audio    (table: sound | artist | reels count | business-OK?)
   ## Topics   (bullet list)
4. Then open https://web.telegram.org → @azmin_digital_bot and send the report as a message
   starting with "TRENDS".
```

Next step: tell Claude Code "trends sent". It saves the report to
`marketing/research/trends/<date>-instagram.md` and uses it with the `trend-scout` skill.
