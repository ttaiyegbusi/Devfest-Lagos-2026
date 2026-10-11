/* Refreshes app/data.json from the published Google Sheet.
 *
 * data.json is the fallback the site serves when a feed cannot be read, and a
 * fallback is only worth having if it is close to the truth. Left alone it
 * rots: in October 2026 the schedule tab published a single #NAME? row for a
 * few minutes, the feed came back with no usable rows, and the page fell back
 * to a data.json that still said published: false — so the schedule read
 * "will be updated soon" while the sheet had a full two days in it.
 *
 * So: run this whenever the sheet changes in a way worth committing, and the
 * fallback stays a snapshot of the sheet rather than the demo data it started
 * as.
 *
 *   node --env-file=.env.local scripts/sync-data.mjs
 *
 * It reads SPEAKERS_URL and SCHEDULE_URL, the same two variables the site
 * reads (and the sheet's sponsors tab, into app/sponsors/sponsors.json), and refuses to write anything if either feed comes back empty — a
 * bad fetch should not be able to wipe the fallback it exists to replace.
 */
import { readFileSync, writeFileSync } from "node:fs";

const OUT = new URL("../app/data.json", import.meta.url);
const SPONSORS_OUT = new URL("../app/sponsors/sponsors.json", import.meta.url);

/** Splits one CSV line, honouring quoted fields and doubled quotes inside them. */
function splitRow(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells;
}

/** The sheet as records keyed by its lower-cased header row. */
function records(body) {
  const lines = [];
  let line = "";
  let quoted = false;
  for (const ch of body.replace(/\r\n/g, "\n")) {
    if (ch === '"') quoted = !quoted;
    if (ch === "\n" && !quoted) {
      lines.push(line);
      line = "";
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  if (!lines.length) return [];

  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((row) => {
    const cells = splitRow(row);
    const record = {};
    headers.forEach((header, i) => {
      record[header] = (cells[i] ?? "").trim();
    });
    return record;
  });
}

const SHEET_ERRORS = new Set([
  "#NAME?",
  "#REF!",
  "#VALUE!",
  "#DIV/0!",
  "#NUM!",
  "#NULL!",
  "#N/A",
  "#ERROR!",
  "#GETTING_DATA",
]);

/* Asked up to five times. The site asks three (see app/schedule/agenda.ts) and
   has to answer a request while it does; this runs on a laptop with nothing
   waiting, so it can afford to be stubborn — and a snapshot written from a
   half-recalculated sheet is the one thing this script must not produce. */
const ATTEMPTS = 5;

async function feed(name) {
  const source = process.env[name];
  if (!source) throw new Error(`${name} is not set`);
  const failures = [];

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const url = new URL(source);
    if (attempt) url.searchParams.set("attempt", String(attempt));

    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const rows = records(await response.text());

      const broken = rows.flatMap(Object.values).find((c) => SHEET_ERRORS.has(c));
      if (broken) throw new Error(`the sheet published ${broken}`);
      if (!rows.length) throw new Error("no rows");

      if (attempt) console.warn(`  ${name}: good on attempt ${attempt + 1}`);
      return rows;
    } catch (error) {
      failures.push(`attempt ${attempt + 1}: ${error.message}`);
    }
  }

  throw new Error(`${name}: ${failures.join("; ")}`);
}

/* Rows are grouped by their day column, in the order the days first appear,
   so the tabs on the site follow the tabs in the sheet. */
function byDay(rows) {
  const days = new Map();
  for (const row of rows) {
    const label = row.day || "Day one";
    if (!days.has(label)) days.set(label, []);
    days.get(label).push(row);
  }
  return days;
}

const optional = (row, keys) =>
  Object.fromEntries(keys.filter((k) => row[k]).map((k) => [k, row[k]]));

/* The image column collects share links, because that is what the Share button
   gives you: ibb.co/AbCdEf is a page about the photo, not the photo. The site
   drops those rather than render a broken image (see directImage in
   app/speakers/lineup.ts) — but this script has a network and no deadline, so
   it resolves them instead, and the committed snapshot gets real pictures
   whatever was pasted into the sheet.

   Every one of these pages carries the file in its og:image, which is what a
   link preview uses. */
const VIEWER_HOSTS = new Set([
  "ibb.co",
  "www.ibb.co",
  "imgur.com",
  "www.imgur.com",
  "photos.app.goo.gl",
  "photos.google.com",
  "drive.google.com",
  "docs.google.com",
  "dropbox.com",
  "www.dropbox.com",
  "1drv.ms",
  "onedrive.live.com",
]);

async function directImage(url, name) {
  if (!url || url.startsWith("/")) return url;

  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    console.warn(`  ${name}: "${url}" is not a URL, dropped`);
    return "";
  }
  if (!VIEWER_HOSTS.has(host)) return url;

  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; devfest-lagos sync)" },
  });
  const found = response.ok
    ? /<meta property="og:image" content="([^"]+)"/.exec(await response.text())?.[1]
    : undefined;
  if (!found) {
    console.warn(`  ${name}: ${host} viewer page, no image found in it, dropped`);
    return "";
  }

  // Google Photos' og:image is cropped to a link-preview box; ask for a width
  // instead and the full picture comes back.
  const image = found.replace(/=w\d+-h\d+-p-k$/, "=w800");
  console.warn(`  ${name}: resolved ${host} viewer page -> ${image}`);
  return image;
}

async function speakers(rows) {
  const days = [];
  for (const [label, group] of byDay(rows)) {
    const people = [];
    for (const row of group) {
      if (!row.name) continue;
      const image = await directImage(row.image, row.name);
      people.push({
        name: row.name,
        role: row.role,
        org: row.org,
        ...(image ? { image } : {}),
      });
    }
    if (people.length) days.push({ label, speakers: people });
  }
  return { announced: true, days };
}

function schedule(rows) {
  const days = [];
  for (const [label, group] of byDay(rows)) {
    const sessions = [];
    for (const row of group) {
      if (!row.title || !row.time) continue;

      // The sheet is one row per speaker: a row repeating the time and title
      // above it is another speaker on that session, not a second session.
      const previous = sessions[sessions.length - 1];
      let session;
      if (previous && previous.time === row.time && previous.title === row.title) {
        session = previous;
      } else {
        session = {
          time: row.time,
          ...optional(row, ["until"]),
          title: row.title,
          ...optional(row, ["track", "format", "summary"]),
          speakers: [],
        };
        sessions.push(session);
      }

      if (row.name) {
        session.speakers.push({ name: row.name, role: row.role, org: row.org });
      }
    }
    if (sessions.length) days.push({ label, sessions });
  }
  return { published: true, days };
}

const [speakerRows, scheduleRows] = await Promise.all([
  feed("SPEAKERS_URL"),
  feed("SCHEDULE_URL"),
]);

const next = {
  ...JSON.parse(readFileSync(OUT, "utf8")),
  speakers: await speakers(speakerRows),
  schedule: schedule(scheduleRows),
};

for (const [key, count] of [
  ["speakers", next.speakers.days.length],
  ["schedule", next.schedule.days.length],
]) {
  if (!count) throw new Error(`${key}: the feed held no usable rows, nothing written`);
}

writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`);

const total = (days, key) => days.reduce((n, d) => n + d[key].length, 0);
console.log(
  `app/data.json: ${total(next.speakers.days, "speakers")} speakers across ` +
    `${next.speakers.days.length} day(s), ` +
    `${total(next.schedule.days, "sessions")} sessions across ` +
    `${next.schedule.days.length} day(s)`,
);

/* The sponsors tab, when the sheet has one. It has no variable of its own:
   it is found by name in the same published sheet as the speakers — see
   feedFor() in app/sponsors/list.ts, which this repeats. Optional where the
   other two are not: a sheet with no sponsors tab yet is not a failed sync.
   Once there is one, the same rule applies — an empty feed writes nothing. */
const TAB = "sponsors";
const index = new URL(process.env.SPEAKERS_URL);
index.pathname = index.pathname.replace(/\/pub$/, "/pubhtml");
index.search = "";
const published = await fetch(index, { cache: "no-store" });
const tab = published.ok
  ? [...(await published.text()).matchAll(
      /items\.push\(\{name: "([^"]+)", pageUrl: "[^"]*?gid(?:=|\\x3d)(\d+)/g,
    )].find(([, name]) => name.trim().toLowerCase() === TAB)
  : undefined;

if (!tab) {
  console.warn(`no published tab named "${TAB}" in the sheet, sponsors.json left as it is`);
} else {
  const source = new URL(process.env.SPEAKERS_URL);
  source.searchParams.set("gid", tab[2]);
  process.env.SPONSORS_TAB = source.href;

  const sponsors = (await feed("SPONSORS_TAB"))
    .filter((row) => row.name)
    .map((row) => ({
      name: row.name,
      ...optional({ logo: row.logo || row.image, url: row.url || row.website || row.link }, ["logo", "url"]),
    }));
  if (!sponsors.length) throw new Error("sponsors: the feed held no usable rows, nothing written");
  writeFileSync(SPONSORS_OUT, `${JSON.stringify({ sponsors }, null, 2)}\n`);
  console.log(`app/sponsors/sponsors.json: ${sponsors.length} sponsor(s)`);
}
