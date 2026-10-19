/**
 * AZMIN DIGITAL — Lead Agent (Google Apps Script)
 *
 * Lives inside a Google Sheet. Finds interior designers and clinics in the
 * target markets with the official Google Places API, checks their websites
 * with Google PageSpeed Insights, scores each lead, finds a public contact
 * email, and drafts a personalised first message. It never sends anything:
 * you review the drafts and send them yourself.
 *
 * Setup: see lead-agent/SETUP.md. In short, paste this file into
 * Extensions → Apps Script, add the script properties below, then use the
 * "AZMIN Leads" menu → "1. Set up sheet".
 *
 * Script properties (Project Settings → Script properties):
 *   GOOGLE_API_KEY      required. One key with "Places API (New)" and
 *                       "PageSpeed Insights API" enabled.
 *   TELEGRAM_BOT_TOKEN  optional. Daily summary to Telegram.
 *   TELEGRAM_CHAT_ID    optional.
 *   SENDER_NAME         optional. Signature name, default "Jabir".
 */

// ---------------------------------------------------------------- settings

// Google gives a free monthly allowance per API. Each Text Search call
// returns up to 20 businesses. 25 calls a day ≈ 750 a month, which keeps
// you inside the free tier. Also set a hard quota cap in Google Cloud
// (SETUP.md step 3) so you can never be charged.
const MAX_SEARCH_CALLS_PER_RUN = 25;
// PageSpeed checks are slow (10–40 s each). Apps Script stops a run after
// 6 minutes, so each run qualifies a few leads and the hourly trigger
// continues where it left off.
const MAX_QUALIFY_PER_RUN = 6;
const RUN_TIME_BUDGET_MS = 4.5 * 60 * 1000;

const AGENCY = {
  name: "AZMIN DIGITAL",
  site: "https://azmindigital.com",
  email: "info@azmindigital.com",
  whatsapp: "+971 56 724 7597",
  work: [
    "purepreciousjewellery.com",
    "msjtechnicaluae.com",
    "graceitme.com",
  ],
};

// Target markets. Edit the Config tab (not this list) once the sheet exists;
// this only seeds it the first time.
const MARKETS = [
  { country: "United Kingdom", code: "GB", cities: ["London", "Manchester", "Birmingham"] },
  { country: "United Arab Emirates", code: "AE", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { country: "Canada", code: "CA", cities: ["Toronto", "Vancouver", "Calgary"] },
  { country: "Germany", code: "DE", cities: ["Berlin", "Munich", "Hamburg"] },
  { country: "Qatar", code: "QA", cities: ["Doha"] },
];
const NICHES = ["interior designer", "clinic"];

// How to approach each market. Cold email rules differ a lot by country:
// Germany (UWG §7) does not allow unsolicited marketing emails, even to
// businesses, without prior consent. Canada (CASL) only allows it when the
// address is publicly listed for business, the message is relevant, and it
// includes your details and an opt-out. UK (PECR) allows it to companies
// with a clear opt-out. These are guidelines, not legal advice.
const CHANNEL_BY_CODE = {
  GB: "Email OK (company addresses) + opt-out line · LinkedIn",
  AE: "WhatsApp / email / call",
  QA: "WhatsApp / email / call",
  CA: "Email only if address is public on their site + opt-out · LinkedIn",
  DE: "NO cold email · call or LinkedIn first, email only after they agree",
};

const LEAD_HEADERS = [
  "Found", "Country", "City", "Niche", "Business", "Phone", "Website", "Email",
  "Rating", "Reviews", "Google Maps", "Place ID", "Website check", "Mobile speed",
  "Lead score", "Why", "Channel", "Draft subject", "Draft message",
  "Status", "Last contact", "Follow-up due", "Notes",
];
const CONFIG_HEADERS = ["Active", "Country", "Code", "City", "Niche", "Next page token", "Done", "Last run"];
const STATUSES = ["New", "Contacted", "Follow-up sent", "Replied", "Call booked", "Won", "Lost", "Skip"];

// ------------------------------------------------------------------- menu

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AZMIN Leads")
    .addItem("1. Set up sheet", "setupSheet")
    .addItem("2. Find new leads now", "findLeads")
    .addItem("3. Check websites + draft messages now", "qualifyLeads")
    .addSeparator()
    .addItem("Turn on daily automation", "installTriggers")
    .addItem("Turn off automation", "removeTriggers")
    .addItem("Send Telegram summary now", "sendSummary")
    .addToUi();
}

// ------------------------------------------------------------------ setup

function setupSheet() {
  const ss = SpreadsheetApp.getActive();
  const leads = ss.getSheetByName("Leads") || ss.insertSheet("Leads");
  if (leads.getLastRow() === 0) {
    leads.appendRow(LEAD_HEADERS);
    leads.setFrozenRows(1);
    leads.getRange(1, 1, 1, LEAD_HEADERS.length).setFontWeight("bold").setBackground("#0b1220").setFontColor("#ffffff");
    const statusCol = LEAD_HEADERS.indexOf("Status") + 1;
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
    leads.getRange(2, statusCol, 5000, 1).setDataValidation(rule);
    leads.setColumnWidth(LEAD_HEADERS.indexOf("Draft message") + 1, 420);
  }

  const config = ss.getSheetByName("Config") || ss.insertSheet("Config");
  if (config.getLastRow() === 0) {
    config.appendRow(CONFIG_HEADERS);
    config.setFrozenRows(1);
    config.getRange(1, 1, 1, CONFIG_HEADERS.length).setFontWeight("bold");
    MARKETS.forEach((m) =>
      m.cities.forEach((city) =>
        NICHES.forEach((niche) => config.appendRow([true, m.country, m.code, city, niche, "", false, ""]))
      )
    );
  }
  SpreadsheetApp.getActive().toast("Sheet ready. Next: AZMIN Leads → 2. Find new leads now", "AZMIN Leads", 8);
}

function installTriggers() {
  removeTriggers();
  // Find leads every morning (Dubai time follows the sheet's time zone).
  ScriptApp.newTrigger("findLeads").timeBased().everyDays(1).atHour(7).create();
  // Check websites and draft messages through the day, a few at a time.
  ScriptApp.newTrigger("qualifyLeads").timeBased().everyHours(1).create();
  ScriptApp.newTrigger("sendSummary").timeBased().everyDays(1).atHour(18).create();
  SpreadsheetApp.getActive().toast("Daily automation is on.", "AZMIN Leads", 6);
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
}

// ------------------------------------------------------------ find leads

function findLeads() {
  const key = prop_("GOOGLE_API_KEY");
  if (!key) throw new Error("Add GOOGLE_API_KEY in Project Settings → Script properties (see SETUP.md).");

  const ss = SpreadsheetApp.getActive();
  const leads = ss.getSheetByName("Leads");
  const config = ss.getSheetByName("Config");
  if (!leads || !config) throw new Error("Run AZMIN Leads → 1. Set up sheet first.");

  const known = new Set(columnValues_(leads, "Place ID"));
  const rows = config.getDataRange().getValues();
  const today = new Date();
  let calls = 0;
  let added = 0;

  // Work through the active searches that still have results to fetch,
  // starting with the ones that ran longest ago.
  const queue = rows
    .map((r, i) => ({ r, i }))
    .slice(1)
    .filter(({ r }) => r[0] === true && r[6] !== true)
    .sort((a, b) => (a.r[7] || 0) - (b.r[7] || 0));

  for (const { r, i } of queue) {
    if (calls >= MAX_SEARCH_CALLS_PER_RUN) break;
    const [, country, code, city, niche, pageToken] = r;
    const res = placesSearch_(key, `${niche} in ${city}`, code, pageToken);
    calls++;

    const fresh = [];
    for (const p of res.places || []) {
      if (!p.id || known.has(p.id)) continue;
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      known.add(p.id);
      fresh.push(leadRow_(today, country, code, city, niche, p));
    }
    if (fresh.length) {
      leads.getRange(leads.getLastRow() + 1, 1, fresh.length, LEAD_HEADERS.length).setValues(fresh);
      added += fresh.length;
    }

    // Save where this search got to: Google returns up to 3 pages (60 results).
    const next = res.nextPageToken || "";
    config.getRange(i + 1, 6, 1, 3).setValues([[next, next === "", today]]);
    if (next) Utilities.sleep(2000); // the next page token takes a moment to become valid
  }

  PropertiesService.getScriptProperties().setProperty("LAST_FIND", JSON.stringify({ at: today.toISOString(), added, calls }));
  ss.toast(`${added} new leads from ${calls} searches.`, "AZMIN Leads", 8);
  return added;
}

function placesSearch_(key, textQuery, regionCode, pageToken) {
  const body = { textQuery, regionCode, pageSize: 20 };
  if (pageToken) body.pageToken = pageToken;
  const res = UrlFetchApp.fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": [
        "places.id", "places.displayName", "places.formattedAddress",
        "places.internationalPhoneNumber", "places.websiteUri", "places.rating",
        "places.userRatingCount", "places.googleMapsUri", "places.businessStatus",
        "nextPageToken",
      ].join(","),
    },
    payload: JSON.stringify(body),
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(`Places API error ${res.getResponseCode()}: ${res.getContentText().slice(0, 300)}`);
  }
  return JSON.parse(res.getContentText());
}

function leadRow_(today, country, code, city, niche, p) {
  const row = new Array(LEAD_HEADERS.length).fill("");
  const set = (h, v) => (row[LEAD_HEADERS.indexOf(h)] = v == null ? "" : v);
  set("Found", today);
  set("Country", country);
  set("City", city);
  set("Niche", niche);
  set("Business", (p.displayName && p.displayName.text) || "");
  set("Phone", p.internationalPhoneNumber);
  set("Website", p.websiteUri);
  set("Rating", p.rating);
  set("Reviews", p.userRatingCount);
  set("Google Maps", p.googleMapsUri);
  set("Place ID", p.id);
  set("Channel", CHANNEL_BY_CODE[code] || "");
  set("Status", "New");
  return row;
}

// ----------------------------------------------------- qualify + draft

function qualifyLeads() {
  const started = Date.now();
  const key = prop_("GOOGLE_API_KEY");
  const leads = SpreadsheetApp.getActive().getSheetByName("Leads");
  if (!leads || leads.getLastRow() < 2) return 0;

  const data = leads.getRange(2, 1, leads.getLastRow() - 1, LEAD_HEADERS.length).getValues();
  const col = (h) => LEAD_HEADERS.indexOf(h);
  let done = 0;

  for (let i = 0; i < data.length; i++) {
    if (done >= MAX_QUALIFY_PER_RUN || Date.now() - started > RUN_TIME_BUDGET_MS) break;
    const row = data[i];
    if (row[col("Lead score")]) continue; // already processed

    const lead = {
      business: row[col("Business")],
      city: row[col("City")],
      country: row[col("Country")],
      niche: row[col("Niche")],
      website: String(row[col("Website")] || ""),
      rating: row[col("Rating")],
      reviews: row[col("Reviews")],
    };
    const check = checkWebsite_(lead.website, key);
    const email = lead.website && check.reachable ? findEmail_(lead.website) : "";
    const score = scoreLead_(lead, check);
    const draft = draftMessage_(lead, check, score);

    const out = [
      check.summary, check.speed === null ? "" : check.speed, score.label, score.why.join("; "),
      draft.subject, draft.body,
    ];
    if (email) leads.getRange(i + 2, col("Email") + 1).setValue(email);
    leads.getRange(i + 2, col("Website check") + 1, 1, 4).setValues([out.slice(0, 4)]);
    leads.getRange(i + 2, col("Draft subject") + 1, 1, 2).setValues([out.slice(4)]);
    done++;
  }
  return done;
}

/** Looks at the website: reachable? HTTPS? Mobile speed from PageSpeed. */
function checkWebsite_(url, key) {
  if (!url) return { reachable: false, https: false, speed: null, summary: "No website" };
  const out = { reachable: false, https: url.indexOf("https://") === 0, speed: null, summary: "" };
  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, validateHttpsCertificates: false });
    out.reachable = res.getResponseCode() < 400;
  } catch (e) {
    out.reachable = false;
  }
  if (!out.reachable) {
    out.summary = "Website not loading";
    return out;
  }
  if (key) {
    try {
      const api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" +
        `?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&key=${key}`;
      const res = UrlFetchApp.fetch(api, { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const json = JSON.parse(res.getContentText());
        const s = json.lighthouseResult && json.lighthouseResult.categories.performance.score;
        if (typeof s === "number") out.speed = Math.round(s * 100);
        const lcp = json.lighthouseResult && json.lighthouseResult.audits["largest-contentful-paint"];
        if (lcp && lcp.numericValue) out.loadSeconds = Math.round(lcp.numericValue / 100) / 10;
      }
    } catch (e) {
      // Speed is a bonus; the lead is still useful without it.
    }
  }
  const parts = [out.https ? "HTTPS" : "No HTTPS"];
  if (out.speed !== null) parts.push(`mobile score ${out.speed}/100`);
  if (out.loadSeconds) parts.push(`loads in ~${out.loadSeconds}s on mobile`);
  out.summary = parts.join(", ");
  return out;
}

/** Hot / Warm / Low, with the reasons that go into the message. */
function scoreLead_(lead, check) {
  const why = [];
  let points = 0;
  if (!lead.website) { points += 3; why.push("no website"); }
  else if (!check.reachable) { points += 3; why.push("website not loading"); }
  else {
    if (!check.https) { points += 2; why.push("not secure (no HTTPS)"); }
    if (check.speed !== null && check.speed < 50) { points += 2; why.push(`slow on mobile (${check.speed}/100)`); }
    else if (check.speed !== null && check.speed < 75) { points += 1; why.push(`could be faster on mobile (${check.speed}/100)`); }
  }
  // Busy, well-reviewed businesses can afford a proper site.
  if (Number(lead.reviews) >= 30) { points += 1; why.push(`${lead.reviews} Google reviews`); }
  const label = points >= 3 ? "Hot" : points >= 2 ? "Warm" : "Low";
  if (!why.length) why.push("site looks fine — low priority");
  return { label, points, why };
}

/** A short, specific first message. You edit and send it yourself. */
function draftMessage_(lead, check, score) {
  const me = prop_("SENDER_NAME") || "Jabir";
  const kind = lead.niche === "clinic" ? "clinic" : "studio";
  const clients = lead.niche === "clinic" ? "patients" : "clients";
  let subject;
  let hook;

  if (!lead.website || !check.reachable) {
    subject = `A website for ${lead.business}`;
    hook = lead.website
      ? `I tried to visit your website and it didn't load, so people who find you on Google Maps may be leaving before they contact you.`
      : `I found ${lead.business} on Google Maps${lead.reviews ? ` (${lead.reviews} reviews — well done)` : ""}, but couldn't find a website. Most ${clients} check a website before they book.`;
  } else {
    subject = `Quick idea for ${lead.business}'s website`;
    const issues = [];
    if (check.loadSeconds) issues.push(`it takes about ${check.loadSeconds} seconds to load on a phone`);
    else if (check.speed !== null && check.speed < 75) issues.push(`it scores ${check.speed}/100 for mobile speed on Google's own test`);
    if (!check.https) issues.push(`browsers mark it "Not secure"`);
    hook = issues.length
      ? `I had a quick look at your website and noticed ${issues.join(" and ")}. That usually costs ${clients} who are searching on their phone.`
      : `I had a look at your website and have a couple of ideas to turn more visitors into enquiries.`;
  }

  const optOut = /Canada|United Kingdom/.test(lead.country)
    ? `\n\nIf this isn't relevant, just reply "no thanks" and I won't contact you again.`
    : "";

  const body =
`Hi ${lead.business} team,

${hook}

I'm ${me} from ${AGENCY.name}. We build fast, premium websites for ${kind}s, with online booking/enquiry forms, WhatsApp chat and proper business email set up. Recent work: ${AGENCY.work.join(", ")}.

Would a free 2-minute video review of what I'd improve be useful?

Best regards,
${me}
${AGENCY.name} · ${AGENCY.site}
${AGENCY.email} · WhatsApp ${AGENCY.whatsapp}${optOut}`;
  return { subject, body };
}

/** First public email on the homepage or contact page, if any. */
function findEmail_(url) {
  const pages = [url, url.replace(/\/$/, "") + "/contact", url.replace(/\/$/, "") + "/contact-us"];
  for (const page of pages) {
    try {
      const res = UrlFetchApp.fetch(page, { muteHttpExceptions: true, followRedirects: true, validateHttpsCertificates: false });
      if (res.getResponseCode() >= 400) continue;
      const email = pickEmail_(res.getContentText());
      if (email) return email;
    } catch (e) {
      // try the next page
    }
  }
  return "";
}

function pickEmail_(html) {
  const found = (html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((e) => e.toLowerCase());
  const junk = /\.(png|jpe?g|gif|svg|webp)$|example\.|sentry|wixpress|domain\.com|email\.com|@2x/;
  const good = found.filter((e) => !junk.test(e));
  // Prefer the usual enquiry inboxes.
  return good.find((e) => /^(info|hello|contact|enquir|inquir|office|reception|admin)/.test(e)) || good[0] || "";
}

// --------------------------------------------------------------- summary

function sendSummary() {
  const token = prop_("TELEGRAM_BOT_TOKEN");
  const chat = prop_("TELEGRAM_CHAT_ID");
  if (!token || !chat) return;
  const leads = SpreadsheetApp.getActive().getSheetByName("Leads");
  if (!leads || leads.getLastRow() < 2) return;
  const data = leads.getRange(2, 1, leads.getLastRow() - 1, LEAD_HEADERS.length).getValues();
  const col = (h) => LEAD_HEADERS.indexOf(h);
  const today = new Date().toDateString();
  const fresh = data.filter((r) => r[col("Found")] instanceof Date && r[col("Found")].toDateString() === today);
  const hot = fresh.filter((r) => r[col("Lead score")] === "Hot");
  const due = data.filter((r) => r[col("Follow-up due")] instanceof Date && r[col("Follow-up due")] <= new Date() && /Contacted|Follow-up sent/.test(r[col("Status")]));
  const text =
    `AZMIN Lead Agent — today\n` +
    `New leads: ${fresh.length} (Hot: ${hot.length})\n` +
    `Follow-ups due: ${due.length}\n` +
    hot.slice(0, 5).map((r) => `• ${r[col("Business")]} (${r[col("City")]}) — ${r[col("Why")]}`).join("\n");
  UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat, text }),
  });
}

/** Set "Last contact" and a follow-up 3 days later when you mark a lead Contacted. */
function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== "Leads" || e.range.getRow() < 2) return;
  if (e.range.getColumn() !== LEAD_HEADERS.indexOf("Status") + 1) return;
  if (!/^(Contacted|Follow-up sent)$/.test(String(e.value))) return;
  const now = new Date();
  const follow = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
  sheet.getRange(e.range.getRow(), LEAD_HEADERS.indexOf("Last contact") + 1, 1, 2).setValues([[now, follow]]);
}

// ---------------------------------------------------------------- helpers

function prop_(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || "";
}

function columnValues_(sheet, header) {
  if (sheet.getLastRow() < 2) return [];
  const c = LEAD_HEADERS.indexOf(header) + 1;
  return sheet.getRange(2, c, sheet.getLastRow() - 1, 1).getValues().map((r) => r[0]).filter(String);
}
