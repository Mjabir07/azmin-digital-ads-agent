# Weekly Flow clips — instruction for Claude in Chrome

**When:** once a week, after the agent posts the new shot list (Telegram message "🎬 New Flow shot list").
**You:** turn on the PC → open Chrome → open https://flow.google.com (logged in) → open the Claude side panel
→ paste the text below → let it run (you can watch or do other things). Takes ~10–20 min of its time, ~1 min of yours.

---

## Paste this into the Claude side panel

```
You are helping AZMIN DIGITAL create this week's video clips in Google Flow.

1. Open this page in a new tab and read the shot list table:
   https://github.com/Mjabir07/azmin-digital-ads-agent/blob/main/marketing/flow/shotlist-current.md
2. In the Google Flow tab, first check Settings: "Visible watermarking" must be OFF (it is allowed on this plan).
   Do NOT use any watermark-removal extension (such as Erasio) — the official setting is enough.
3. Create a new Flow project named exactly as the "Project name" line in the shot list.
4. For EACH row in the shot list table, in order:
   - Agent mode OFF. Model: Veo 3.1 – Fast. Aspect ratio: 9:16 (or as the row says). Outputs: x1. Length: 8s.
   - Paste the row's prompt exactly and generate.
   - When it finishes, download the 720p original (never pay for upscaling).
   - Rename/remember the clip by its Shot ID (e.g. W01-S1).
5. Budget: stop and ask me if total credits for this session would go above the "Credit budget" line in the shot list.
6. When all clips are downloaded, open https://web.telegram.org, open the chat with @azmin_digital_bot,
   and send every downloaded clip as a VIDEO/FILE with its Shot ID as the caption (e.g. "W01-S1").
   If you cannot attach files, stop and tell me — I will drag them in myself.
7. Finally, report: which shots were made, credits used, and anything that failed.
```

---

## Rules the shot list always follows
- 9:16 vertical, 8 s, Veo 3.1 Fast, 720p, x1 → ~20 credits per clip.
- Weekly budget: ~200 credits (≈10 clips) so the 1,050 monthly credits last the month with room for retries.
- Prompts: no text, no logos, no real brand names, no real people's likeness; cinematic, UAE-relevant scenes.
- Phone/laptop screens: Veo adds fake text on screens — we cover screens with our real designs in Remotion.
