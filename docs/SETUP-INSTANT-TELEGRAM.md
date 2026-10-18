# Instant Telegram replies (Cloudflare Worker, free)

Makes ✅/❌ taps answer in about 1 second, and saves clips you send to the bot automatically.
About 10 minutes, one time. The code is in `cloudflare/telegram-worker.js`.

## A. GitHub token (lets the worker start the publisher)
1. github.com → your photo → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Name: `azmin-telegram-worker` · Expiration: **1 year** · Repository access: **Only select repositories** → `azmin-digital-ads-agent`.
3. Permissions → Repository permissions → **Contents: Read and write**. (Metadata: Read is added automatically.)
4. **Generate token** and copy it. Keep it open; it is shown only once. Never paste it in chat.

## B. A secret word (proves messages really come from Telegram)
Make up a long random word using only letters, numbers, `_` or `-` (30+ characters), for example by mashing the keyboard.
You'll paste the **same** word in two places (steps C5 and D2).

## C. Cloudflare Worker
1. Go to https://dash.cloudflare.com/sign-up and create a free account (verify the email).
2. Left menu → **Compute (Workers)** → **Workers & Pages** → **Create** → **Create Worker** (Start with Hello World).
3. Name it `azmin-telegram` → **Deploy**.
4. **Edit code** → delete everything → paste the whole file `cloudflare/telegram-worker.js` → **Deploy**.
   Copy the worker address shown, like `https://azmin-telegram.<something>.workers.dev`.
5. Worker → **Settings** → **Variables and Secrets** → **Add**:
   | Type | Name | Value |
   | --- | --- | --- |
   | Secret | `TELEGRAM_BOT_TOKEN` | the same bot token you put in GitHub Secrets |
   | Secret | `TELEGRAM_CHAT_ID` | your chat ID (same as in GitHub Secrets) |
   | Secret | `WEBHOOK_SECRET` | the secret word from step B |
   | Secret | `GH_TOKEN` | the GitHub token from step A |
   | Text | `GH_REPO` | `Mjabir07/azmin-digital-ads-agent` |
   Then **Deploy**.

## D. Tell GitHub the worker's address and secret
1. Repo → **Settings** → **Secrets and variables** → **Actions** → **Variables** tab → **New repository variable**:
   Name `TELEGRAM_WEBHOOK_URL`, value = the worker address from C4.
2. **Secrets** tab → **New repository secret**: Name `TELEGRAM_WEBHOOK_SECRET`, value = the secret word from B.

## E. Switch on
Tell Claude Code "cloudflare done". It turns instant mode on (the `telegram-webhook` workflow) and sends a test.
To switch back to 5-minute checking: put `delete` in `ops/telegram-webhook.trigger`.

Renew the GitHub token before it expires (1 year); the bot will say "⚠️ Not saved" if it has expired.
