import local from "./speakers.json";

/* Where the lineup comes from.
 *
 * By default, the committed speakers.json next to this file: edit it, commit,
 * and the next deploy carries it. That is the whole of it for a repo the
 * organisers can push to.
 *
 * To edit the lineup without touching the repo, set SPEAKERS_URL and point it
 * at either a JSON feed of the same shape or a published Google Sheet. The
 * sheet route, in full:
 *
 *   1. One row per speaker, with a header row naming the columns
 *      day, name, role, org, image — in any order, any capitalisation.
 *      "day" is whatever you want the tab to read: "Day one", "Saturday".
 *   2. File -> Share -> Publish to web -> Comma-separated values (.csv).
 *   3. Set SPEAKERS_URL to the URL that dialog gives you.
 *
 * Images in a sheet are URLs, and they must be direct links to an image file.
 * A Google Drive share link is a link to a viewer page, not to a picture, and
 * will not render.
 *
 * The feed is re-read every five minutes, so a spreadsheet edit reaches the
 * site within that without a deploy. If the fetch fails for any reason — sheet
 * unpublished, network down, a column renamed — the committed lineup is served
 * instead and the reason is logged. A speaker list is not worth a broken page.
 */

const SOURCE = process.env.SPEAKERS_URL;
const REVALIDATE_SECONDS = 300;

export type Speaker = {
  name: string;
  role: string;
  /** The organisation, set large across the card's artwork. */
  org: string;
  /** A direct URL or a path under public/, e.g. "/speakers/ada.webp". */
  image?: string;
  /** Placeholder artwork, derived from the org when there is no image. */
  tint: [string, string];
};

export type Day = {
  label: string;
  /** Optional second line under the tab, e.g. "Friday". */
  date?: string;
  speakers: Speaker[];
};

export type Lineup = { days: Day[] };

/* Placeholder artwork. A sheet should not have to carry a pair of hex codes
   per row, so the tint is derived from the organisation's name instead: the
   same name always draws the same colour, and two different names rarely
   collide because the palette is longer than any one day's lineup. */
const TINTS: [string, string][] = [
  ["#4285F4", "#1B3A73"],
  ["#34A853", "#123D1F"],
  ["#F9AB00", "#5C3E00"],
  ["#EA4335", "#5A1710"],
  ["#00C3F7", "#04435C"],
  ["#8B5CF6", "#2E1B52"],
  ["#0357EE", "#04204F"],
];

function tintFor(org: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < org.length; i++) hash = (hash * 31 + org.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

/* Everything past this point treats its input as untrusted. A spreadsheet is
   edited by people in a hurry: cells arrive padded with spaces, rows are left
   half-finished, and a column gets renamed the week of the event. Rows that
   cannot name a person are dropped rather than rendered as a blank card. */

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

function toSpeaker(row: Record<string, unknown>): Speaker | null {
  const name = text(row.name);
  if (!name) return null;
  const org = text(row.org);
  const image = text(row.image);
  return {
    name,
    role: text(row.role),
    org,
    ...(image ? { image } : {}),
    tint: tintFor(org || name),
  };
}

/** Splits one CSV line, honouring quoted fields and doubled quotes inside them. */
function splitRow(line: string): string[] {
  const cells: string[] = [];
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

/** A published sheet: one row per speaker, grouped into days by its day column. */
function fromCsv(body: string): Lineup {
  // A quoted cell may contain newlines, so the file is walked character by
  // character rather than split on \n.
  const lines: string[] = [];
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
  if (!lines.length) return { days: [] };

  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());
  const days = new Map<string, Speaker[]>();
  const order: string[] = [];

  for (const row of lines.slice(1)) {
    const cells = splitRow(row);
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = cells[i] ?? "";
    });
    const speaker = toSpeaker(record);
    if (!speaker) continue;
    const day = text(record.day) || "Day one";
    if (!days.has(day)) {
      days.set(day, []);
      order.push(day);
    }
    days.get(day)!.push(speaker);
  }

  return { days: order.map((label) => ({ label, speakers: days.get(label)! })) };
}

/** The JSON shape: days, each with its own list. */
function fromJson(value: unknown): Lineup {
  const days = (value as { days?: unknown })?.days;
  if (!Array.isArray(days)) return { days: [] };
  return {
    days: days.flatMap((entry) => {
      const day = entry as { label?: unknown; date?: unknown; speakers?: unknown };
      const label = text(day.label);
      const speakers = Array.isArray(day.speakers)
        ? day.speakers
            .map((s) => toSpeaker(s as Record<string, unknown>))
            .filter((s): s is Speaker => s !== null)
        : [];
      if (!label || !speakers.length) return [];
      const date = text(day.date);
      return [{ label, ...(date ? { date } : {}), speakers }];
    }),
  };
}

const COMMITTED = fromJson(local);

export async function getLineup(): Promise<Lineup> {
  if (!SOURCE) return COMMITTED;

  try {
    const response = await fetch(SOURCE, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const body = await response.text();
    // A published sheet answers with CSV whatever the URL looks like, and a
    // JSON feed never begins with anything but a brace or a bracket.
    const trimmed = body.trimStart();
    const lineup =
      trimmed.startsWith("{") || trimmed.startsWith("[")
        ? fromJson(JSON.parse(body))
        : fromCsv(body);

    if (!lineup.days.length) throw new Error("no usable rows in the feed");
    return lineup;
  } catch (error) {
    // Never a broken page over a speaker list.
    console.error(
      `[speakers] could not read SPEAKERS_URL, serving the committed lineup:`,
      error,
    );
    return COMMITTED;
  }
}
