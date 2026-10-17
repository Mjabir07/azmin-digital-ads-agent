# Weekly Flow clips — instruction for Claude in Chrome

**When:** once a week, after the agent posts the new shot list (Telegram message "🎬 New Flow shot list").
**One-time setup:** in Chrome open `chrome://extensions` → Claude → **Details** → turn ON **Allow access to file URLs**.
And log in to https://web.telegram.org once in the same Chrome.

**You:** turn on the PC → open Chrome → open https://flow.google.com (logged in) → open the Claude side panel
→ paste the text below → let it run (you can watch or do other things). Takes ~10–20 min of its time, ~1 min of yours.

---

## Paste this into the Claude side panel

```
You are helping AZMIN DIGITAL create this week's video clips in Google Flow.

1. Open this page in a new tab and read the shot list table:
   https://github.com/Mjabir07/azmin-digital-ads-agent/blob/claude/vibrant-heisenberg-g8uqdx/marketing/flow/shotlist-current.md
2. In the Google Flow tab, first check Settings: "Visible watermarking" must be OFF (it is allowed on this plan).
   Do NOT use any watermark-removal extension (such as Erasio) — the official setting is enough.
3. Create a new Flow project named exactly as the "Project name" line in the shot list.
4. For EACH row in the shot list table, in order:
   - If the row's "Character" column says "Jabir avatar", add my saved avatar character (Characters /
     Ingredients) to the prompt before generating. Otherwise use no character.
   - Agent mode OFF. Model: Veo 3.1 – Fast. Aspect ratio: 9:16 (or as the row says). Outputs: x1. Length: 8s.
   - Paste the row's prompt exactly and generate.
   - When it finishes, download the 720p original (never pay for upscaling).
   - Rename/remember the clip by its Shot ID (e.g. W01-S1).
5. Budget: stop and ask me if total credits for this session would go above the "Credit budget" line in the shot list.
6. Send the clips to my bot automatically (do this right after each clip downloads, or all at the end):
   - Open https://web.telegram.org in a new tab (I am already logged in) and open the chat "@azmin_digital_bot".
   - Click the paperclip (📎) → "Photo or Video" / "File" → choose the downloaded clip from Downloads
     (the newest .mp4 file). Use the file_upload tool if you have it.
   - In the caption box type ONLY the Shot ID (e.g. W01-A1) and press Send. One clip per message.
   - If the file window opens and you cannot choose the file yourself, STOP and say:
     "Please pick <file name> in the window and press Open" — wait for me, then type the caption and send.
7. When all are sent, send one more text message to the bot: "done W01" (use the week from the shot list).
8. Finally, report: which shots were made, credits used, and anything that failed.
```

---

## Rules the shot list always follows
- 9:16 vertical, 8 s, Veo 3.1 Fast, 720p, x1 → ~20 credits per clip.
- Weekly budget: ~200 credits (≈10 clips) so the 1,050 monthly credits last the month with room for retries.
- Prompts: no text, no logos, no real brand names, no real people's likeness (except Jabir's own avatar character); cinematic, UAE-relevant scenes.
- Phone/laptop screens: Veo adds fake text on screens — we cover screens with our real designs in Remotion.
