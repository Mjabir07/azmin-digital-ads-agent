# Lead Agent: setup (about 20 minutes, all in the browser)

The Lead Agent is a Google Sheet with a script inside it. Every day it finds
**interior designers and clinics** in the **UK, UAE, Canada, Germany and Qatar**
on Google Maps, checks their websites, scores each lead and drafts a first
message for you. It never sends anything by itself.

```
Google Places API ──► Leads tab ──► website + speed check ──► score (Hot/Warm/Low)
                                                         └──► draft message ──► you review & send
```

Cost: **free**, as long as you keep the quota cap from step 3. Google Maps
Platform gives a free monthly allowance per API; the agent uses about 750
searches a month, under that allowance, and the cap makes going over impossible.

---

## 1. Create the Google Sheet

1. Go to **sheets.new** (signed in with the Google account you want to use).
2. Name it **AZMIN Leads**.
3. Click **Extensions → Apps Script**.
4. Delete the sample code, then paste everything from
   [`apps-script/Code.gs`](apps-script/Code.gs). Click **Save** (💾).

## 2. Create the Google API key

1. Go to **console.cloud.google.com** and create a project called **azmin-leads**.
2. Billing: Google requires a billing account for the Places API even when you
   stay in the free allowance. **Billing → Link a billing account** and add a card.
3. **APIs & Services → Library**, search for and **Enable**:
   - **Places API (New)**
   - **PageSpeed Insights API**
4. **APIs & Services → Credentials → Create credentials → API key**. Copy it.
5. Click the key → **API restrictions → Restrict key** → tick only
   **Places API (New)** and **PageSpeed Insights API** → **Save**.

## 3. Make sure you can never be charged

1. **APIs & Services → Places API (New) → Quotas & System Limits.**
2. Find **"SearchTextRequest per day"** (or "Text Search requests per day") →
   **Edit** → set **30** → **Save**.
3. **Billing → Budgets & alerts → Create budget** → amount **$1** → alert at 50%,
   90%, 100%. You get an email if anything ever costs money.

## 4. Add the key to the script

In the Apps Script tab: **Project Settings (⚙) → Script properties → Add**

| Property | Value |
|---|---|
| `GOOGLE_API_KEY` | the key from step 2 |
| `SENDER_NAME` | `Jabir` (name used to sign messages) |
| `TELEGRAM_BOT_TOKEN` | optional: your bot token for a daily summary |
| `TELEGRAM_CHAT_ID` | optional: your chat ID |

Click **Save script properties**.

## 5. First run

1. Go back to the Sheet and **reload the page**. A menu **AZMIN Leads** appears.
2. **AZMIN Leads → 1. Set up sheet.** Google asks for permission the first
   time: click **Continue → choose your account → Advanced → Go to project → Allow**.
   (It's your own script; the warning is normal.)
3. **AZMIN Leads → 2. Find new leads now.** Leads appear in the **Leads** tab.
4. **AZMIN Leads → 3. Check websites + draft messages now.** Each run checks a
   few leads (website checks are slow), fills **Lead score**, **Why** and the
   **Draft message**.
5. **AZMIN Leads → Turn on daily automation.** From now on it finds leads at
   07:00, checks websites every hour and (if set) sends a Telegram summary at 18:00.

## 6. Your daily routine (15–30 minutes)

1. Filter the **Leads** tab: **Lead score = Hot**, **Status = New**.
2. Read the **Draft message**, adjust one line to make it personal, and send it
   from **hello@azmindigital.com** (or WhatsApp / LinkedIn, see **Channel**).
3. Change **Status** to **Contacted**. The sheet fills **Last contact** and a
   **Follow-up due** date 3 days later.
4. Send 10–20 a day, not hundreds. Small, personal batches keep your email
   reputation healthy.

## Rules per country (built into the "Channel" column)

| Country | How to reach out |
|---|---|
| UAE, Qatar | WhatsApp, email or a call |
| United Kingdom | Email to company addresses is OK with an opt-out line (included in the draft) |
| Canada | Email only if the address is published on their website for business, with an opt-out line (included) |
| Germany | **Don't cold-email.** Call or connect on LinkedIn first; email only after they agree |

This is a practical summary, not legal advice.

## Changing what it searches

Open the **Config** tab:
- Untick **Active** to pause a city/niche, or add a row for a new one
  (Country, 2-letter Code, City, Niche).
- **Done** turns on when Google has no more results for that search. Untick it
  (and clear **Next page token**) after a few months to search again for new businesses.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Add GOOGLE_API_KEY…" | Step 4: property name must be exactly `GOOGLE_API_KEY` |
| "Places API error 403" | Places API (New) not enabled, or the key restriction doesn't include it |
| "Places API error 429" | Daily quota reached (step 3). It continues tomorrow |
| No Mobile speed | PageSpeed Insights API not enabled on the key; leads still get scored |
