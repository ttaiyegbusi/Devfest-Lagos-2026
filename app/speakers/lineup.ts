import data from "../data.json";

/* Where the lineup comes from.
 *
 * By default, the committed data.json at the app root (the "speakers" key):
 * edit it, commit, and the next deploy carries it. That is the whole of it
 * for a repo the organisers can push to.
 *
 * To edit the lineup without touching the repo, set SPEAKERS_URL and point it
 * at the speakers tab of a published Google Sheet. Columns:
 *
 *   day, name, role, org, image — in any order, any capitalisation.
 *
 * In Sheets: File -> Share -> Publish to web -> pick the speakers tab ->
 * Comma-separated values (.csv), then set SPEAKERS_URL to that URL.
 *
 * "image" takes either a direct link to an image file or a share link to a
 * page holding one — an ImgBB or Google Photos link straight out of the Share
 * button is fine, see withImages below.
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

export type Lineup = {
  days: Day[];
  /** False while the lineup is still being confirmed: every card reads TBD. */
  announced: boolean;
};

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

/* Exported because the team page draws its people with the same placeholder
   artwork. One palette, one hash, so a face-less card looks the same wherever
   it appears. */
export function tintFor(org: string): [string, string] {
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

/* Hosts whose share links point at a page about the picture rather than the
   picture. Pasting one into the sheet is the single most common mistake in the
   image column, because the link the "Share" button hands you is this one and
   it looks right. Rendering it gives a broken image icon on the card, which is
   worse than the placeholder the card already knows how to draw — so these are
   dropped, and the reason is logged with the name so it can be fixed.

   The direct link lives on a sibling host: ibb.co/AbCdEf is the page,
   i.ibb.co/.../photo.jpg is the file. */
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

/** The file behind a viewer page, which is what its link preview shows. */
async function ogImage(page: string, attempt: number): Promise<string | undefined> {
  // A second ask needs its own cache key, or it is served the refusal the
  // first one got.
  const url = new URL(page);
  if (attempt) url.searchParams.set("retry", String(attempt));
  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { "user-agent": "Mozilla/5.0 (compatible; devfest-lagos)" },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const found = /<meta property="og:image" content="([^"]+)"/.exec(
    await response.text(),
  )?.[1];
  // Google Photos crops its og:image to a link-preview box; ask for a width
  // instead and the whole picture comes back.
  return found?.replace(/=w\d+-h\d+-p-k$/, "=w800");
}

/* The photograph this speaker had the last time the sheet was synced.
 *
 * Resolving a viewer page means asking an image host for a web page on every
 * revalidation, and image hosts rate-limit: on 9 October the home page
 * rendered with two of its six photographs missing while /speakers, rendered
 * a moment apart, had all fourteen. Both pages were right about what they
 * were told and wrong about what to show.
 *
 * So a failed lookup falls back to the snapshot in data.json, whose images
 * scripts/sync-data.mjs has already resolved. A speaker photographed in the
 * committed lineup does not lose their face to someone else's rate limiter;
 * only a speaker added to the sheet since the last sync can, and they get the
 * initials until it succeeds. */
const COMMITTED_IMAGES = new Map(
  (data.speakers?.days ?? []).flatMap((day) =>
    (day.speakers ?? []).flatMap((s) => {
      const entry = s as { name?: string; image?: string };
      return entry.name && entry.image
        ? ([[entry.name.trim().toLowerCase(), entry.image]] as [string, string][])
        : [];
    }),
  ),
);

/** One image: the URL as given, the file behind it, or nothing. */
async function usableImage(url: string, name: string): Promise<string | undefined> {
  if (!url) return undefined;
  // A path under public/, e.g. "/speakers/ada.webp".
  if (url.startsWith("/")) return url;

  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    console.warn(`[speakers] ${name}: "${url}" is not a URL, no image used`);
    return undefined;
  }
  if (!VIEWER_HOSTS.has(host)) return url;

  // Twice, because the usual failure is a rate limiter rather than a wrong
  // address, and a rate limiter often says yes on the second ask.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const image = await ogImage(url, attempt);
      if (image) return image;
      throw new Error("no og:image on the page");
    } catch (error) {
      if (attempt) {
        const committed = COMMITTED_IMAGES.get(name.trim().toLowerCase());
        console.warn(
          `[speakers] ${name}: could not resolve ${url}, ` +
            `${committed ? "serving the committed photograph" : "drawing the placeholder"}:`,
          error,
        );
        return committed;
      }
    }
  }
  return undefined;
}

/* Resolving the image column, after the rows are parsed.
 *
 * The column collects viewer pages, because the link the Share button gives
 * you is one: ibb.co/AbCdEf is a page about the photo, i.ibb.co/.../photo.jpg
 * is the photo. Pasting the first renders a broken image icon on the card.
 *
 * The comment above this function used to say "must be a direct link", which
 * is true and did not help: the lineup arrived in October 2026 with fourteen
 * viewer pages in it. So the page resolves them instead of asking the sheet to
 * be careful — one fetch per distinct link, on the same five-minute
 * revalidation as the feed itself, and the placeholder when that fails too. */
async function withImages(lineup: Lineup): Promise<Lineup> {
  const seen = new Map<string, Promise<string | undefined>>();
  const resolve = (url: string, name: string) => {
    const pending = seen.get(url) ?? usableImage(url, name);
    seen.set(url, pending);
    return pending;
  };

  const days = await Promise.all(
    lineup.days.map(async (day) => ({
      ...day,
      speakers: await Promise.all(
        day.speakers.map(async ({ image, ...speaker }) => {
          const found = image ? await resolve(image, speaker.name) : undefined;
          return found ? { ...speaker, image: found } : speaker;
        }),
      ),
    })),
  );

  return { ...lineup, days };
}

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

/* A published spreadsheet error. The speakers tab is typed by hand, so it has
   no formulas to break — but it is a tab in the same file as ones that do, and
   a stray formula added later should cost freshness rather than put #REF! on a
   card. See the long version in app/schedule/agenda.ts. */
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

const isSheetError = (cell: string) => SHEET_ERRORS.has(cell.trim().toUpperCase());

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
  if (!lines.length) return { days: [], announced: true };

  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());
  const days = new Map<string, Speaker[]>();
  const order: string[] = [];

  for (const row of lines.slice(1)) {
    const cells = splitRow(row);
    const broken = cells.find(isSheetError);
    if (broken) throw new Error(`the feed carries a spreadsheet error (${broken})`);

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

  return {
    days: order.map((label) => ({ label, speakers: days.get(label)! })),
    announced: true,
  };
}

/** The JSON shape: days, each with its own list. */
function fromJson(value: unknown): Lineup {
  const { days, announced } = (value ?? {}) as {
    days?: unknown;
    announced?: unknown;
  };
  // Only an explicit `false` holds the names back; a feed that says nothing
  // about it is taken to be the real lineup.
  const isAnnounced = announced !== false;
  if (!Array.isArray(days)) return { days: [], announced: isAnnounced };
  return {
    announced: isAnnounced,
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

/* Not announced yet: the cards stay, so the wall and the grid keep their
   shape, but every name, role and organisation reads TBD. The tint is kept
   from the placeholder row so the wall is not one flat colour. */
function masked(lineup: Lineup): Lineup {
  if (lineup.announced) return lineup;
  return {
    ...lineup,
    days: lineup.days.map((day) => ({
      ...day,
      speakers: day.speakers.map((s) => ({
        name: "Speaker TBD",
        role: "To be announced",
        org: "TBD",
        tint: s.tint,
      })),
    })),
  };
}

const COMMITTED = masked(fromJson(data.speakers));

/* Asked more than once, for the reason set out in app/schedule/agenda.ts: a
   published sheet is served from a cache that can hold more than one snapshot
   of the same tab, and one request is not evidence. */
const ATTEMPTS = 3;

/** The feed, or a throw describing every attempt that failed. */
async function fromFeed(source: string): Promise<Lineup> {
  const failures: string[] = [];

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    // A retry served the same cached response is not a retry, so each attempt
    // gets its own URL.
    const url = new URL(source);
    if (attempt) url.searchParams.set("attempt", String(attempt));

    try {
      const response = await fetch(url, {
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
      failures.push(`attempt ${attempt + 1}: ${(error as Error).message}`);
    }
  }

  throw new Error(failures.join("; "));
}

export async function getLineup(): Promise<Lineup> {
  if (!SOURCE) return COMMITTED;

  try {
    return masked(await withImages(await fromFeed(SOURCE)));
  } catch (error) {
    // Never a broken page over a speaker list.
    console.error(
      `[speakers] could not read SPEAKERS_URL, serving the committed lineup:`,
      error,
    );
    return COMMITTED;
  }
}
