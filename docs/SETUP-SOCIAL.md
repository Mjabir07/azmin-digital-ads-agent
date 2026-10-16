# Setting up your accounts — baby steps (for Jabir)

Do one step, tell Claude "done", then do the next. If a screen looks different from what is written
here (Meta changes buttons often), send Claude a screenshot and ask.

All images are in `marketing/social/kit-v1/` (Claude also sends them to you in chat — tap and save).
All texts to copy are in `marketing/social/profile-text.md` and `marketing/social/starter-posts.md`.

---
## Step 1 — WhatsApp Business on your new number (about 15 min)
1. Put the new SIM in your phone (a dual-SIM phone is fine) and make sure it can receive SMS.
2. Open the App Store / Play Store, search **WhatsApp Business** (green icon with a **B**), install it.
   It works next to your normal WhatsApp — they don't disturb each other.
3. Open it → **Agree and continue** → enter the **new number** → type the 6-digit code you get by SMS.
4. Business name: **AZMIN DIGITAL**. Category: **Professional Services**. Profile photo: `profile-picture.png`.
5. Tap **⋮ (or Settings) → Business tools → Business profile** → paste the **Description**.
6. **Business tools → Greeting message** → turn on → paste the greeting → Save.
7. **Business tools → Quick replies** → add each shortcut from the table (`/q1`, `/q2`, `/q3`, `/price`, `/work`, `/services`, `/how`, `/audit`, `/call`).
8. **Business profile → Website** → `https://azmindigital.com`; **About** → paste the About line.
✅ Test: from your personal WhatsApp, send "Hi" to the new number. You should get the greeting.

## Step 2 — Make Facebook and Instagram look professional (about 10 min)
**Facebook (in the Facebook app, switch to the AZMIN DIGITAL Page):**
1. Tap the profile picture → **Upload** → `profile-picture.png`.
2. Tap the cover → **Upload** → `facebook-cover.png`.
3. **Edit details / Bio** → paste the Facebook intro. Category: **Web Designer**.

**Instagram (switch to the AZMIN DIGITAL account):**
1. **Edit profile** → picture → `profile-picture.png`.
2. **Name:** `AZMIN DIGITAL | Websites UAE` · **Bio:** paste the Instagram bio.
3. If it says "Personal account": **Settings → Account type and tools → Switch to professional account → Business**, category **Web Designer**.

## Step 3 — Connect WhatsApp to your Page and Instagram (about 10 min)
This is what makes the "Send WhatsApp message" button in your ads work.
1. Facebook app → your Page → **Settings → Linked accounts → WhatsApp** → enter the new number → enter the code sent to WhatsApp Business.
2. Facebook Page → **Add action button → Send WhatsApp message** → choose the new number.
3. Instagram → **Edit profile → Contact options / Action buttons → WhatsApp** → choose the new number.
✅ Test: open your Page and Instagram from someone else's phone — the WhatsApp button should open a chat with the new number.

## Step 4 — Post the 6 starter posts (about 15 min)
An empty page looks like a scam; 6 posts make people trust you.
1. Install **Meta Business Suite** (app) and log in → it shows your Page and Instagram.
2. **Create post** → tick **both Facebook and Instagram** → add `post-1-hello.png` → paste caption 1 + hashtags → **Publish**.
3. Repeat for posts 2 → 6, in order.
4. (Optional) Post `ad1-price-story.png` as a **Story** and save it to a highlight called **Offer** with `highlight-offer.png` as the cover.

## Step 5 — Ad account and payment (about 15 min) — needed before ads can run
1. On a browser go to **business.facebook.com** → log in. If it asks, create a **Business portfolio** named **AZMIN DIGITAL**.
2. **Settings → Accounts → Pages** → make sure your Page is there (add it if not). Same for **Instagram accounts** and **WhatsApp accounts**.
3. **Settings → Accounts → Ad accounts → Add → Create a new ad account**:
   - Name: `AZMIN DIGITAL Ads` · **Time zone: (GMT+04:00) Asia/Dubai** · **Currency: AED**
   - ⚠️ Time zone and currency can't be changed later — double-check them.
4. **Billing & payments → Add payment method** → add your card.
5. Note your ad account number (looks like `act_123456789`) — you'll need it for the daily report.

## Step 6 — Launch the ads
Follow `docs/LAUNCH.md` (campaign settings, which images, which text). Claude walks you through it live.

## Step 7 — Turn on the daily report
Add the GitHub Secrets (see Claude's message / `docs/SETUP.md`), run **Actions → daily-report → Run workflow**.
