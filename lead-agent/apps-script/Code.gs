/**
 * AZMIN DIGITAL — Lead Agent (Google Apps Script)
 *
 * Lives inside a Google Sheet. Finds interior designers and clinics in the
 * target markets, checks their websites with Google PageSpeed Insights,
 * scores each lead, finds the public contact email, and drafts a
 * personalised first message. It never sends anything: you review the
 * drafts and send them yourself.
 *
 * Where leads come from (first one with a key wins):
 *   1. TomTom Search API  — free, no credit card, 2,500 requests a day,
 *                           includes phone and website. Recommended.
 *   2. Google Places API  — best data, but needs a Google billing account.
 *   3. OpenStreetMap      — no key at all; fewer contact details.
 *
 * Setup: see lead-agent/SETUP.md.
 *
 * Script properties (Project Settings → Script properties):
 *   TOMTOM_API_KEY      recommended. Free key from developer.tomtom.com.
 *   GOOGLE_API_KEY      recommended. Free key with "PageSpeed Insights API"
 *                       enabled (no billing needed) for the speed check.
 *   GOOGLE_PLACES       optional. Set to "on" to use Google Places instead
 *                       of TomTom (needs billing + "Places API (New)").
 *   TELEGRAM_BOT_TOKEN  optional. Daily summary to Telegram.
 *   TELEGRAM_CHAT_ID    optional.
 *   SENDER_NAME         optional. Signature name, default "Jabir".
 */

// ---------------------------------------------------------------- settings

// Searches per run. TomTom allows 2,500 a day free; this uses far less.
const MAX_SEARCHES_PER_RUN = 20;
// Each search fetches up to 100 businesses; stop paging a search after this
// many so every city gets a turn.
const MAX_RESULTS_PER_SEARCH = 300;
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
  work: ["purepreciousjewellery.com", "msjtechnicaluae.com", "graceitme.com"],
};

// Target markets. This only seeds the Config tab the first time; after that
// edit the Config tab instead. Radius is in km around the city centre.
const MARKETS = [
  { country: "United Kingdom", code: "GB", lang: "en-GB", cities: [["London", 51.5074, -0.1278, 20], ["Manchester", 53.4808, -2.2426, 12], ["Birmingham", 52.4862, -1.8904, 12]] },
  { country: "United Arab Emirates", code: "AE", lang: "en-GB", cities: [["Dubai", 25.2048, 55.2708, 25], ["Abu Dhabi", 24.4539, 54.3773, 20], ["Sharjah", 25.3463, 55.4209, 12]] },
  { country: "Canada", code: "CA", lang: "en-US", cities: [["Toronto", 43.6532, -79.3832, 20], ["Vancouver", 49.2827, -123.1207, 15], ["Calgary", 51.0447, -114.0719, 15]] },
  { country: "Germany", code: "DE", lang: "de-DE", cities: [["Berlin", 52.52, 13.405, 15], ["Munich", 48.1351, 11.582, 12], ["Hamburg", 53.5511, 9.9937, 12]] },
  { country: "Qatar", code: "QA", lang: "en-GB", cities: [["Doha", 25.2854, 51.531, 20]] },
];
const NICHES = ["interior designer", "clinic"];
// What to type into the search, per niche (German terms for Germany).
const SEARCH_TEXT = {
  "interior designer": { DE: "Innenarchitekt", default: "interior designer" },
  clinic: { DE: "Arztpraxis", default: "clinic" },
};

// Words that show a result really is in the niche. Results that match
// neither the category nor the name are dropped, so the sheet stays clean.
const NICHE_MATCH = {
  "interior designer": /interior|innen|design|décor|decor|fit[- ]?out|architect/i,
  clinic: /clinic|clinique|klinik|doctor|dentist|dental|medical|medizin|praxis|health|physio|dermat|aesthetic|polyclinic|surgery/i,
};
// Big chains and hospitals rarely buy a website from a freelancer.
const SKIP_NAME = /hospital|krankenhaus|pharmacy|apotheke|ikea|home ?centre|pan emirates|nhs |boots|superdrug|walgreens|cvs/i;

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
  "Found", "Country", "City", "Niche", "Business", "Address", "Phone", "Website", "Email",
  "Rating", "Reviews", "Verify on Google Maps", "Lead ID", "Source",
  "Website check", "Mobile speed", "Lead score", "Why", "Channel", "Draft subject", "Draft message",
  "Status", "Last contact", "Follow-up due", "Notes",
];
const CONFIG_HEADERS = ["Active", "Country", "Code", "Language", "City", "Niche", "Search text", "Lat", "Lon", "Radius km", "Next offset", "Done", "Last run"];
const C = Object.fromEntries(CONFIG_HEADERS.map((h, i) => [h, i]));
const STATUSES = ["New", "Verified", "Contacted", "Follow-up sent", "Replied", "Call booked", "Won", "Lost", "Skip"];
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

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
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
    leads.getRange(2, LEAD_HEADERS.indexOf("Status") + 1, 5000, 1).setDataValidation(rule);
    leads.setColumnWidth(LEAD_HEADERS.indexOf("Draft message") + 1, 420);
  }

  const config = ss.getSheetByName("Config") || ss.insertSheet("Config");
  if (config.getLastRow() === 0) {
    config.appendRow(CONFIG_HEADERS);
    config.setFrozenRows(1);
    config.getRange(1, 1, 1, CONFIG_HEADERS.length).setFontWeight("bold");
    const rows = [];
    MARKETS.forEach((m) =>
      m.cities.forEach(([city, lat, lon, km]) =>
        NICHES.forEach((niche) => {
          const text = SEARCH_TEXT[niche][m.code] || SEARCH_TEXT[niche].default;
          rows.push([true, m.country, m.code, m.lang, city, niche, text, lat, lon, km, 0, false, ""]);
        })
      )
    );
    config.getRange(2, 1, rows.length, CONFIG_HEADERS.length).setValues(rows);
  }
  ss.toast(`Sheet ready. Lead source: ${sourceName_()}. Next: AZMIN Leads → 2. Find new leads now`, "AZMIN Leads", 10);
}

function installTriggers() {
  removeTriggers();
  // Find leads a few times a day until every search is done, then it idles.
  ScriptApp.newTrigger("findLeads").timeBased().everyHours(6).create();
  // Check websites and draft messages through the day, a few at a time.
  ScriptApp.newTrigger("qualifyLeads").timeBased().everyHours(1).create();
  ScriptApp.newTrigger("sendSummary").timeBased().everyDays(1).atHour(18).create();
  SpreadsheetApp.getActive().toast("Daily automation is on.", "AZMIN Leads", 6);
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
}

// ------------------------------------------------------------ find leads

function sourceName_() {
  if (prop_("GOOGLE_PLACES") === "on" && prop_("GOOGLE_API_KEY")) return "Google Places";
  if (prop_("TOMTOM_API_KEY")) return "TomTom";
  return "OpenStreetMap";
}

function findLeads() {
  const started = Date.now();
  const ss = SpreadsheetApp.getActive();
  const leads = ss.getSheetByName("Leads");
  const config = ss.getSheetByName("Config");
  if (!leads || !config) throw new Error("Run AZMIN Leads → 1. Set up sheet first.");

  const source = sourceName_();
  const known = new Set(columnValues_(leads, "Lead ID"));
  // Also skip the same business found twice under different IDs.
  const knownNames = new Set(columnValues_(leads, "Business"));
  const rows = config.getDataRange().getValues();
  const today = new Date();
  let searches = 0;
  let added = 0;

  const queue = rows
    .map((r, i) => ({ r, i }))
    .slice(1)
    .filter(({ r }) => r[C.Active] === true && r[C.Done] !== true)
    .sort((a, b) => (a.r[C["Last run"]] || 0) - (b.r[C["Last run"]] || 0));

  for (const { r, i } of queue) {
    if (searches >= MAX_SEARCHES_PER_RUN || Date.now() - started > RUN_TIME_BUDGET_MS) break;
    const search = {
      country: r[C.Country], code: r[C.Code], lang: r[C.Language] || "en-GB", city: r[C.City],
      niche: r[C.Niche], text: r[C["Search text"]] || r[C.Niche],
      lat: Number(r[C.Lat]), lon: Number(r[C.Lon]), km: Number(r[C["Radius km"]]) || 15,
      offset: Number(r[C["Next offset"]]) || 0,
    };

    let page;
    try {
      page = source === "TomTom" ? tomtomSearch_(search)
        : source === "Google Places" ? placesSearch_(search)
        : osmSearch_(search);
    } catch (e) {
      console.warn(`Search failed (${search.niche}, ${search.city}): ${e.message}`);
      config.getRange(i + 1, C["Last run"] + 1).setValue(today);
      searches++;
      continue;
    }
    searches++;

    const fresh = [];
    for (const b of page.results) {
      const nameKey = `${b.name}|${search.city}`.toLowerCase();
      if (!b.id || known.has(b.id) || knownNames.has(nameKey)) continue;
      if (!isGenuine_(b, search.niche)) continue;
      known.add(b.id);
      knownNames.add(nameKey);
      fresh.push(leadRow_(today, search, b, source));
    }
    if (fresh.length) {
      leads.getRange(leads.getLastRow() + 1, 1, fresh.length, LEAD_HEADERS.length).setValues(fresh);
      added += fresh.length;
    }

    const done = !page.next || page.next >= MAX_RESULTS_PER_SEARCH;
    config.getRange(i + 1, C["Next offset"] + 1, 1, 3).setValues([[done ? 0 : page.next, done, today]]);
    Utilities.sleep(source === "OpenStreetMap" ? 5000 : 400); // be polite to the free services
  }

  ss.toast(`${added} new leads from ${searches} searches (${source}).`, "AZMIN Leads", 8);
  return added;
}

/** Drop results that aren't real, independent businesses in the niche. */
function isGenuine_(b, niche) {
  if (!b.name || b.name.length < 3) return false;
  if (b.chain) return false;
  if (SKIP_NAME.test(b.name)) return false;
  const text = `${b.name} ${b.category || ""}`;
  return NICHE_MATCH[niche].test(text);
}

/** TomTom Search API. Free key, no card: developer.tomtom.com */
function tomtomSearch_(s) {
  const params = {
    key: prop_("TOMTOM_API_KEY"), lat: s.lat, lon: s.lon, radius: Math.round(s.km * 1000),
    limit: 100, ofs: s.offset, countrySet: s.code, idxSet: "POI", language: s.lang,
  };
  const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(s.text)}.json?` + query_(params);
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error(`TomTom ${res.getResponseCode()}: ${res.getContentText().slice(0, 200)}`);
  const json = JSON.parse(res.getContentText());
  const results = (json.results || []).map((r) => {
    const poi = r.poi || {};
    const cats = (poi.classifications || []).map((c) => c.code).concat(poi.categories || []);
    return {
      id: `tomtom:${r.id}`,
      name: poi.name || "",
      address: (r.address && r.address.freeformAddress) || "",
      phone: poi.phone || "",
      website: normaliseUrl_(poi.url),
      category: cats.join(", "),
      chain: (poi.brands || []).length > 0,
    };
  });
  const total = (json.summary && json.summary.totalResults) || 0;
  const next = s.offset + 100 < total ? s.offset + 100 : 0;
  return { results, next };
}

/** Google Places API (New). Needs a billing account. */
function placesSearch_(s) {
  const body = {
    textQuery: `${s.text} in ${s.city}`, regionCode: s.code, pageSize: 20,
    locationBias: { circle: { center: { latitude: s.lat, longitude: s.lon }, radius: Math.min(50000, s.km * 1000) } },
  };
  const token = PropertiesService.getScriptProperties().getProperty(`PAGE_${s.city}_${s.niche}`);
  if (s.offset && token) body.pageToken = token;
  const res = UrlFetchApp.fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: {
      "X-Goog-Api-Key": prop_("GOOGLE_API_KEY"),
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus,places.primaryTypeDisplayName,nextPageToken",
    },
    payload: JSON.stringify(body),
  });
  if (res.getResponseCode() !== 200) throw new Error(`Places ${res.getResponseCode()}: ${res.getContentText().slice(0, 200)}`);
  const json = JSON.parse(res.getContentText());
  const results = (json.places || [])
    .filter((p) => !p.businessStatus || p.businessStatus === "OPERATIONAL")
    .map((p) => ({
      id: `google:${p.id}`,
      name: (p.displayName && p.displayName.text) || "",
      address: p.formattedAddress || "",
      phone: p.internationalPhoneNumber || "",
      website: normaliseUrl_(p.websiteUri),
      rating: p.rating, reviews: p.userRatingCount, maps: p.googleMapsUri,
      category: (p.primaryTypeDisplayName && p.primaryTypeDisplayName.text) || "",
    }));
  if (json.nextPageToken) PropertiesService.getScriptProperties().setProperty(`PAGE_${s.city}_${s.niche}`, json.nextPageToken);
  return { results, next: json.nextPageToken ? s.offset + 20 : 0 };
}

/** OpenStreetMap via the free Overpass API. No key; fewer contact details. */
function osmSearch_(s) {
  const a = `(around:${Math.round(s.km * 1000)},${s.lat},${s.lon})`;
  const name = `["name"~"interior|innen|decor|fit ?out|design",i]`;
  const body = s.niche === "clinic"
    ? `nwr["amenity"~"^(clinic|dentist|doctors)$"]["name"]${a};nwr["healthcare"~"^(clinic|dentist|doctor)$"]["name"]${a};`
    : `nwr["office"~"interior_design|architect|designer|company"]${name}${a};nwr["craft"~"interior"]["name"]${a};nwr["shop"="interior_decoration"]${name}${a};`;
  const q = `[out:json][timeout:50];(${body});out center tags 400;`;

  let lastError = "";
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = UrlFetchApp.fetch(mirror, { method: "post", payload: { data: q }, muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) { lastError = `${res.getResponseCode()}`; continue; }
      const els = JSON.parse(res.getContentText()).elements || [];
      const results = els.map((e) => {
        const t = e.tags || {};
        const addr = [t["addr:housenumber"], t["addr:street"], t["addr:city"] || s.city].filter(Boolean).join(" ");
        return {
          id: `osm:${e.type}/${e.id}`,
          name: t.name || "",
          address: addr,
          phone: t.phone || t["contact:phone"] || "",
          website: normaliseUrl_(t.website || t["contact:website"] || t.url),
          email: t.email || t["contact:email"] || "",
          category: [t.amenity, t.healthcare, t.office, t.craft, t.shop].filter(Boolean).join(", "),
          chain: Boolean(t.brand || t["brand:wikidata"]),
        };
      });
      // Businesses with contact details first: they're the most useful leads.
      results.sort((x, y) => contactScore_(y) - contactScore_(x));
      return { results, next: 0 };
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(`OpenStreetMap busy (${lastError}); it will retry next run`);
}

function contactScore_(b) {
  return (b.website ? 2 : 0) + (b.phone ? 1 : 0) + (b.email ? 1 : 0);
}

function leadRow_(today, s, b, source) {
  const row = new Array(LEAD_HEADERS.length).fill("");
  const set = (h, v) => (row[LEAD_HEADERS.indexOf(h)] = v == null ? "" : v);
  set("Found", today);
  set("Country", s.country);
  set("City", s.city);
  set("Niche", s.niche);
  set("Business", b.name);
  set("Address", b.address);
  set("Phone", b.phone);
  set("Website", b.website);
  set("Email", b.email);
  set("Rating", b.rating);
  set("Reviews", b.reviews);
  // One click to confirm the business is real and see its reviews.
  set("Verify on Google Maps", b.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name} ${b.address || s.city}`)}`);
  set("Lead ID", b.id);
  set("Source", source);
  set("Channel", CHANNEL_BY_CODE[s.code] || "");
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
      business: row[col("Business")], city: row[col("City")], country: row[col("Country")],
      niche: row[col("Niche")], website: String(row[col("Website")] || ""),
      reviews: row[col("Reviews")], source: row[col("Source")],
    };
    const check = checkWebsite_(lead.website, key);
    const email = row[col("Email")] || (lead.website && check.reachable ? findEmail_(lead.website) : "");
    const score = scoreLead_(lead, check);
    const draft = draftMessage_(lead, check, score);

    const r = i + 2;
    if (email) leads.getRange(r, col("Email") + 1).setValue(email);
    leads.getRange(r, col("Website check") + 1, 1, 4).setValues([[
      check.summary, check.speed === null ? "" : check.speed, score.label, score.why.join("; "),
    ]]);
    leads.getRange(r, col("Draft subject") + 1, 1, 2).setValues([[draft.subject, draft.body]])
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    done++;
  }
  return done;
}

/** Looks at the website: reachable? HTTPS? Mobile speed from PageSpeed. */
function checkWebsite_(url, key) {
  if (!url) return { known: false, reachable: false, https: false, speed: null, summary: "No website listed" };
  const out = { known: true, reachable: false, https: url.indexOf("https://") === 0, speed: null, summary: "" };
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
  try {
    const api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" +
      query_({ url, strategy: "mobile", category: "performance", key: key || undefined });
    const res = UrlFetchApp.fetch(api, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const lh = JSON.parse(res.getContentText()).lighthouseResult || {};
      const s = lh.categories && lh.categories.performance.score;
      if (typeof s === "number") out.speed = Math.round(s * 100);
      const lcp = lh.audits && lh.audits["largest-contentful-paint"];
      if (lcp && lcp.numericValue) out.loadSeconds = Math.round(lcp.numericValue / 100) / 10;
    }
  } catch (e) {
    // Speed is a bonus; the lead is still useful without it.
  }
  const parts = [out.https ? "HTTPS" : "No HTTPS"];
  parts.push(out.speed !== null ? `mobile score ${out.speed}/100` : "speed not checked");
  if (out.loadSeconds) parts.push(`loads in ~${out.loadSeconds}s on mobile`);
  out.summary = parts.join(", ");
  return out;
}

/**
 * Hot / Warm / Check / Low, with the reasons that go into the message.
 * "Check" means no website was listed: map data often misses websites,
 * so confirm on Google Maps before saying they don't have one.
 */
function scoreLead_(lead, check) {
  const why = [];
  let points = 0;
  if (!check.known) {
    why.push("no website listed — confirm on Google Maps (if none, it's a Hot lead)");
    return { label: "Check", points: 0, why };
  }
  if (!check.reachable) { points += 3; why.push("website not loading"); }
  else {
    if (!check.https) { points += 2; why.push("not secure (no HTTPS)"); }
    if (check.speed !== null && check.speed < 50) { points += 2; why.push(`slow on mobile (${check.speed}/100)`); }
    else if (check.speed !== null && check.speed < 75) { points += 1; why.push(`could be faster on mobile (${check.speed}/100)`); }
  }
  if (Number(lead.reviews) >= 30) { points += 1; why.push(`${lead.reviews} Google reviews`); }
  const label = points >= 3 ? "Hot" : points >= 2 ? "Warm" : "Low";
  if (!why.length) why.push("site looks fine — low priority");
  return { label, points, why };
}

/** A short, specific first message. You edit and send it yourself. */
function draftMessage_(lead, check, score) {
  const me = prop_("SENDER_NAME") || "Jabir";
  const kind = lead.niche === "clinic" ? "clinic" : "interior design studio";
  const clients = lead.niche === "clinic" ? "patients" : "clients";
  let subject;
  let hook;

  if (!check.known) {
    // Only claim what we know. You confirm on Google Maps first.
    subject = `More enquiries for ${shortName_(lead.business) || "your " + lead.niche.replace("interior designer", "studio")}`;
    hook = `I came across ${shortName_(lead.business) || "your business"} while looking at ${lead.niche}s in ${lead.city}. Most ${clients} now check a website and message on WhatsApp before they book, so I wanted to share an idea.`;
  } else if (!check.reachable) {
    subject = `Your website seems to be down`;
    hook = `I tried to visit your website and it didn't load, so people who find you online may be leaving before they contact you.`;
  } else {
    subject = shortName_(lead.business) ? `Quick idea for ${shortName_(lead.business)}'s website` : `Quick idea for your website`;
    const issues = [];
    if (check.loadSeconds && check.loadSeconds >= 3) issues.push(`it takes about ${check.loadSeconds} seconds to load on a phone`);
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
`${greeting_(lead)}

${hook}

I'm ${me} from ${AGENCY.name}. We build fast, premium websites for ${kind}s, with online booking/enquiry forms, WhatsApp chat and proper business email set up. Recent work: ${AGENCY.work.join(", ")}.

Would a free 2-minute video review of what I'd improve be useful?

Best regards,
${me}
${AGENCY.name} · ${AGENCY.site}
${AGENCY.email} · WhatsApp ${AGENCY.whatsapp}${optOut}`;
  return { subject, body };
}

/**
 * Map listings often stuff keywords into the name ("Top Interior Designer
 * London Award Winning…"). Use the real brand part when it looks like a
 * name, otherwise fall back to a neutral greeting.
 */
function shortName_(name) {
  let n = String(name || "").split(/\s[|–—-]\s|,|\(|:/)[0].trim();
  const words = n.split(/\s+/).filter(Boolean);
  const stuffed = /\b(best|top|award|no\.? ?1|#1|leading|affordable|cheap|near me)\b/i.test(n);
  const generic = /^(interior designers?|interior design|clinic|dental clinic|medical (centre|center)|doctor|dentist)( in [a-z ]+)?$/i.test(n);
  if (!n || stuffed || generic || words.length > 5) return "";
  return n;
}

function greeting_(lead) {
  const n = shortName_(lead.business);
  return n ? `Hi ${n} team,` : "Hi there,";
}

/** First public email on the homepage or contact page, if any. */
function findEmail_(url) {
  const base = url.replace(/\/$/, "");
  const pages = [url, base + "/contact", base + "/contact-us", base + "/impressum", base + "/kontakt"];
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
  const junk = /\.(png|jpe?g|gif|svg|webp)$|example\.|sentry|wixpress|domain\.com|email\.com|@2x|yourname|name@/;
  const good = found.filter((e) => !junk.test(e));
  return good.find((e) => /^(info|hello|contact|enquir|inquir|office|reception|admin|praxis|kontakt)/.test(e)) || good[0] || "";
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
  const check = fresh.filter((r) => r[col("Lead score")] === "Check");
  const due = data.filter((r) => r[col("Follow-up due")] instanceof Date && r[col("Follow-up due")] <= new Date() && /Contacted|Follow-up sent/.test(r[col("Status")]));
  const text =
    `AZMIN Lead Agent — today\n` +
    `New leads: ${fresh.length} (Hot: ${hot.length}, to check: ${check.length})\n` +
    `Follow-ups due: ${due.length}\n` +
    hot.slice(0, 5).map((r) => `• ${r[col("Business")]} (${r[col("City")]}) — ${r[col("Why")]}`).join("\n");
  UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
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

function query_(params) {
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
}

function normaliseUrl_(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `http://${s}`;
}

function columnValues_(sheet, header) {
  if (sheet.getLastRow() < 2) return [];
  const c = LEAD_HEADERS.indexOf(header) + 1;
  const vals = sheet.getRange(2, c, sheet.getLastRow() - 1, 1).getValues().map((r) => r[0]);
  if (header !== "Business") return vals.filter(String);
  // Business names are matched together with their city.
  const cities = sheet.getRange(2, LEAD_HEADERS.indexOf("City") + 1, sheet.getLastRow() - 1, 1).getValues();
  return vals.map((n, i) => (n ? `${n}|${cities[i][0]}`.toLowerCase() : "")).filter(String);
}
