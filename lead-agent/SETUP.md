# Lead Agent: setup (about 20 minutes, all in the browser, no credit card)

The Lead Agent is a Google Sheet with a script inside it. It finds
**interior designers and clinics** in the **UK, UAE, Canada, Germany and Qatar**,
checks their websites, scores each lead and drafts a first message for you.
It never sends anything by itself.

```
TomTom (or OpenStreetMap) ──► Leads tab ──► website + speed check ──► score ──► draft message ──► you review & send
```

## Where the leads come from

| Source | Card needed? | Data | When it's used |
|---|---|---|---|
| **TomTom Search API** | **No** | Business name, address, **phone, website** | When `TOMTOM_API_KEY` is set (recommended) |
| OpenStreetMap | No, and no key | Fewer phones and websites | Automatic backup when there's no TomTom key |
| Google Places | Yes (billing) | Best | Only if you later set `GOOGLE_PLACES` = `on` |

Only genuine, independent businesses are kept: chains, hospitals, pharmacies and
results outside the niche are dropped, duplicates are skipped, and every lead has a
**Verify on Google Maps** link so you can confirm it in one click.

---

## 1. Create the Google Sheet

1. Go to **sheets.new**, name it **AZMIN Leads**.
2. **Extensions → Apps Script**, delete the sample code, paste everything from
   [`apps-script/Code.gs`](apps-script/Code.gs), click **Save**.

## 2. Free TomTom key (no card)

1. Go to **developer.tomtom.com** → **Register** (top right). Sign up with your email
   and confirm the email they send you.
2. After you log in, open your **Dashboard** → **Keys**. A key called
   "My first API key" is usually there already. If not: **Create key**, tick
   **Search API**, save.
3. Copy the key.

## 3. Free Google key for the speed check (no billing needed)

1. **console.cloud.google.com** → project **azmin-leads** →
   **APIs & Services → Library** → enable **PageSpeed Insights API**.
2. **APIs & Services → Credentials → Create credentials → API key**. Copy it.
3. Click the key → **API restrictions → Restrict key** → tick only
   **PageSpeed Insights API** → **Save**.

## 4. Add the keys to the script

In the Apps Script tab: **Project Settings (⚙) → Script properties → Add script property**

| Property | Value |
|---|---|
| `TOMTOM_API_KEY` | the TomTom key from step 2 |
| `GOOGLE_API_KEY` | the Google key from step 3 |
| `SENDER_NAME` | `Jabir` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | optional daily summary |

Click **Save script properties**.

## 5. First run

1. Go back to the Sheet and **reload the page**. A menu **AZMIN Leads** appears.
2. **AZMIN Leads → 1. Set up sheet.** Google asks for permission the first time:
   **Continue → your account → Advanced → Go to AZMIN Lead Agent (unsafe) → Allow**.
   (It's your own script; the warning is normal.)
3. **AZMIN Leads → 2. Find new leads now.**
4. **AZMIN Leads → 3. Check websites + draft messages now** (a few leads per run).
5. **AZMIN Leads → Turn on daily automation.**

## 6. Daily routine (15–30 minutes)

Start with the **No Website** tab: businesses with no website on their listing and none
at their obvious domain names (the agent checks e.g. `name.co.uk`, `name.ae`). They need
exactly what AZMIN sells, so they convert best, and their draft offers a free homepage
mock-up. (If the tab is missing, run **AZMIN Leads → 1. Set up sheet** once more.)

1. In **No Website**, pick a lead and click **Verify on Google Maps** to confirm it's real
   and still has no website.
2. Read the **Draft message**, make one line personal, send it (see **Channel**).
3. In the **Leads** tab, set that lead's **Status = Contacted** (the No Website tab is a
   read-only view). **Follow-up due** fills in 3 days later.
4. When the no-website leads are done, move on to **Lead score = Hot** in the Leads tab
   (broken, insecure or slow websites), then **Warm**. Skip **Low**.
5. 10–20 messages a day, not hundreds.

## Rules per country (built into the "Channel" column)

| Country | How to reach out |
|---|---|
| UAE, Qatar | WhatsApp, email or a call |
| United Kingdom | Email to company addresses with an opt-out line (included in the draft) |
| Canada | Email only if the address is published on their website, with an opt-out line (included) |
| Germany | **No cold email.** Call or LinkedIn first; email only after they agree |

A practical summary, not legal advice.

## Changing what it searches

**Config** tab: untick **Active** to pause a row, edit **Search text** (for example
"dentist", "aesthetic clinic", "fit-out company"), or add rows for new cities
(Lat/Lon from Google Maps: right-click the city → the numbers at the top).
**Done** turns on when a search has no more results; untick it later to search again.

## Troubleshooting

| Problem | Fix |
|---|---|
| Toast says "Lead source: OpenStreetMap" | `TOMTOM_API_KEY` missing or misspelled in Script properties |
| "TomTom 403" | Key doesn't have Search API ticked, or today's 2,500 free requests are used |
| "OpenStreetMap busy" | Free servers are busy; it retries automatically next run |
| "speed not checked" | `GOOGLE_API_KEY` missing, or PageSpeed Insights API not enabled |
