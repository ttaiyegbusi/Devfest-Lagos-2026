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
 * reads, and refuses to write anything if either feed comes back empty — a
 * bad fetch should not be able to wipe the fallback it exists to replace.
 */
import { readFileSync, writeFileSync } from "node:fs";

const OUT = new URL("../app/data.json", import.meta.url);

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

async function feed(name) {
  const url = process.env[name];
  if (!url) throw new Error(`${name} is not set`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${name}: ${response.status} ${response.statusText}`);
  }
  return records(await response.text());
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

function speakers(rows) {
  const days = [];
  for (const [label, group] of byDay(rows)) {
    const people = group
      .filter((row) => row.name)
      .map((row) => ({
        name: row.name,
        role: row.role,
        org: row.org,
        ...optional(row, ["image"]),
      }));
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
  speakers: speakers(speakerRows),
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
