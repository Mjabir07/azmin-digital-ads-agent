# Daily Yara clips in Flow (second account, 50 free credits a day)

**Account:** the Google account with **50 Flow credits a day** (refreshes daily at 5:10 PM Dubai time).
**Budget:** 2 clips a day (opening + ending), about 20 credits each = **40 of 50**. Never go above 50.
**Your part (about 1 minute):** turn on the PC → open Chrome → open https://labs.google/flow (logged in to the
50-credit account) → open the Claude side panel → paste the text below → let it run.
**One-time setup** (already done for the weekly routine): Chrome → `chrome://extensions` → Claude → Details →
**Allow access to file URLs** ON, and log in to https://web.telegram.org once in the same Chrome.

After the clips reach the bot, the agent edits the full reel (motion graphics, captions, sound) and sends it to
Telegram for ✅. Nothing posts without your approval.

---

## Paste this into the Claude side panel

```
You are helping AZMIN DIGITAL make today's 2 video clips of our AI presenter "Yara" in Google Flow.

1. Open this page in a new tab and read it:
   https://github.com/Mjabir07/azmin-digital-ads-agent/blob/main/marketing/flow/daily-shots.md
   Find the section for TODAY's date (Dubai time). Make only the rows in that section.
   If today's section is missing, use the first section whose date has no "✅ done" mark, and tell me which one you used.
2. In Flow, check the credits shown under the account picture. If there are fewer than 40, make only the "-H" (opening)
   clip, and tell me.
3. Character: if a saved character/avatar named "Yara AZMIN" exists in this account, add it to every prompt.
   If it does NOT exist yet, create it once:
   - Download this image: https://raw.githubusercontent.com/Mjabir07/azmin-digital-ads-agent/main/brand/ambassador/yara.jpg
   - In Flow, create a character/avatar from that image (use "Create avatar" or Characters/Ingredients) and name it "Yara AZMIN".
   - If you cannot upload the file yourself, STOP and ask me to pick it in the file window.
   The face must always be this same woman. The outfit and place change every day as written in the prompt.
4. For each row of today's section, in order:
   - Settings: Agent mode OFF · Model: Veo 3.1 – Fast · Aspect ratio 9:16 · Outputs x1 · Length 8 s.
   - "Visible watermarking" must be OFF in Settings (allowed on this plan). Never use watermark-removal extensions.
   - Add the "Yara AZMIN" character, paste the row's prompt EXACTLY, generate.
   - If the result has a different face, extra people, text on screen, or the speech is cut off, regenerate ONCE
     (only if credits allow). Otherwise keep it.
   - Download the 720p original (never pay for upscaling). Remember it by its Shot ID (e.g. D02-H).
5. Send each clip to the Telegram bot:
   - Open https://web.telegram.org (already logged in) → chat "@azmin_digital_bot".
   - Paperclip 📎 → Photo or Video / File → choose the newest downloaded .mp4 (use the file_upload tool if you have it).
   - Caption: ONLY the Shot ID (e.g. D02-H). Send. One clip per message.
   - If the file window opens and you cannot choose the file, STOP and say "Please pick <file name> and press Open".
6. When done, send the text message "done <date>" (e.g. "done 2026-11-02") to the bot.
7. Report: which clips were made, credits used, credits left, anything that failed.
```
