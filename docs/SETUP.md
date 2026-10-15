# Setup guide (for Jabir)

Do these in order. Claude Code will walk you through each one when you ask.

## A. Cloud setup (nothing installed on your PC)
1. GitHub repo `Mjabir07/azmin-digital-ads-agent` — done, kit files already pushed.
2. Make sure the repo is **Private** (Settings → General → Danger Zone → Change visibility).
3. (no upload needed)
4. Go to **claude.ai/code** (or the Code tab in the Claude app) → connect GitHub → allow access
   to the `azmin-digital-ads-agent` repo → start a cloud session on it.
5. Secrets: repo → **Settings → Secrets and variables → Actions → New repository secret**.
   Add each key from `.env.example` there (never in files).

## A2. Google Sheet (your dashboard + lead tracker)
1. Create a Google Sheet "AZMIN DIGITAL Ads Agent" with tabs `metrics`, `leads`, `actions_log`.
2. Claude Code will guide you to create a Google Cloud **service account**, share the sheet with
   its email, and save its JSON key as the `GOOGLE_SERVICE_ACCOUNT_JSON` secret.

## B. Meta access (needed for Phase 1)
1. Finish the account checklist in `docs/PLAYBOOK.md` §3 first (Business Portfolio, ad account in AED).
2. Go to **developers.facebook.com** → My Apps → Create App → type **Business** → link it to the
   AZMIN DIGITAL Business Portfolio.
3. Add the **Marketing API** product to the app.
4. In Business Settings → Users → **System users** → create a system user (Admin) → assign it your
   **ad account** → Generate token with `ads_read` (Phase 1) and later `ads_management` (Phase 2).
5. Copy into `.env`: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` (format `act_1234567890`),
   `META_APP_ID`, `META_APP_SECRET`.

## C. Owner notifications (Phase 1)
- **Telegram (recommended):** message @BotFather → /newbot → copy token to `TELEGRAM_BOT_TOKEN`;
  send your bot a message, then Claude Code will help you find `TELEGRAM_CHAT_ID`.
- or **Email:** an app password from your email provider.

## D. Claude API (Phase 1)
- console.anthropic.com → API keys → create → `ANTHROPIC_API_KEY`. Add a small monthly spend limit.

## E. WhatsApp Cloud API (Phase 3 only)
- In the same Meta app, add the **WhatsApp** product, add a phone number, create a permanent token
  for the system user with `whatsapp_business_messaging` and `whatsapp_business_management`.
- You'll need a public HTTPS URL for the webhook (Claude Code will suggest a hosting option).

## Never
- Never paste tokens into chats, screenshots or commits. They go only in `.env`.
