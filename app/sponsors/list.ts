import local from "./sponsors.json";

/* Where the sponsors come from — the same arrangement as the speaker lineup
 * and the schedule, for the same reason. By default the committed
 * sponsors.json next to this file; with SPEAKERS_URL set, the tab named
 * "sponsors" in that same published Google Sheet. Columns, in any order and
 * any capitalisation:
 *
 *   name, logo, url
 *
 * Only the name is required. See app/speakers/lineup.ts for the long version
 * of how a published tab is read and why it is distrusted.
 *
 * THERE IS NO SPONSORS_URL, ON PURPOSE. It is one sheet, and a second variable
 * pointing at the same document is a second thing to set on every host and to
 * forget. A published tab's address differs from its neighbour's only in its
 * gid, and the sheet's own published index says which gid belongs to which
 * tab name — see feedFor() below. So the tab has to be called "sponsors", and
 * it has to be published: File → Share → Publish to web, either the entire
 * document or that tab by name.
 *
 * Entries are treated as untrusted: blank cells count as missing, and a row
 * with no name is dropped rather than drawn as an empty gap in the band. */

const SOURCE = process.env.SPEAKERS_URL;

/** The tab, by the name on it. Any capitalisation. */
const TAB = "sponsors";
const REVALIDATE_SECONDS = 300;

export type Sponsor = {
  name: string;
  /** A direct URL or a path under public/. Falls back to the name without it. */
  logo?: string;
  /** Where the logo links to. Without it the logo is not a link. */
  url?: string;
};

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/* A logo has to be something an <img> can load and a link something a browser
   can follow. A cell holding anything else — "TBC", a file name off someone's
   desktop — is dropped, and the sponsor is drawn by name instead. */
const isAddress = (value: string) => /^https?:\/\//i.test(value) || value.startsWith("/");

function toSponsor(value: unknown): Sponsor | null {
  const row = (value ?? {}) as Record<string, unknown>;
  const name = text(row.name);
  if (!name) return null;
  const logo = text(row.logo) || text(row.image);
  const url = text(row.url) || text(row.website) || text(row.link);
  return {
    name,
    ...(isAddress(logo) ? { logo } : {}),
    ...(/^https?:\/\//i.test(url) ? { url } : {}),
  };
}

function fromJson(value: unknown): Sponsor[] {
  const list = Array.isArray(value) ? value : (value as { sponsors?: unknown })?.sponsors;
  return Array.isArray(list)
    ? list.map(toSponsor).filter((s): s is Sponsor => s !== null)
    : [];
}

/* A spreadsheet error, published. See app/schedule/agenda.ts: a feed carrying
   one is a feed mid-recalculation, and is treated like one that could not be
   fetched. */
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

/** A published sheet: one row per sponsor, in the order they should appear. */
function fromCsv(body: string): Sponsor[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());

  return lines.slice(1).flatMap((row) => {
    const cells = splitRow(row);
    const broken = cells.find((c) => SHEET_ERRORS.has(c.trim().toUpperCase()));
    if (broken) throw new Error(`the feed carries a spreadsheet error (${broken})`);

    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = cells[i] ?? "";
    });
    const sponsor = toSponsor(record);
    return sponsor ? [sponsor] : [];
  });
}

const COMMITTED = fromJson(local);

/* The committed file began as invented companies and said so in a _comment
   starting PLACEHOLDER. Exported so the ask panel can decline to name those in
   a sentence — see app/chat/knowledge.ts. A list read from the sheet is never
   a placeholder. */
export const COMMITTED_IS_PLACEHOLDER = [(local as { _comment?: unknown })._comment]
  .flat()
  .join(" ")
  .includes("PLACEHOLDER");

/* Google serves a published tab from a cache that does not always agree with
   itself, so one request decides nothing. See app/schedule/agenda.ts. */
const ATTEMPTS = 3;

/* The sponsors tab's address, worked out from the speakers tab's.
 *
 * .../pub?gid=123&single=true&output=csv is one tab; the same address with
 * another gid is another. The gids are listed, by tab name, in the script of
 * the sheet's published index page (.../pubhtml), which is what Google's own
 * tab bar is drawn from.
 *
 * That page is not an API and its markup is Google's to change. If it does,
 * this throws, the committed sponsors are served, and the reason is in the
 * log — the same as any other feed that cannot be read. */
async function feedFor(speakers: string): Promise<URL> {
  const url = new URL(speakers);
  if (!url.pathname.endsWith("/pub") || !url.searchParams.has("gid")) {
    throw new Error("SPEAKERS_URL is not a published Google Sheet tab");
  }

  const index = new URL(url);
  index.pathname = index.pathname.replace(/\/pub$/, "/pubhtml");
  index.search = "";
  const response = await fetch(index, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!response.ok) throw new Error(`the sheet index answered ${response.status}`);

  const tabs = [
    ...(await response.text()).matchAll(
      /items\.push\(\{name: "([^"]+)", pageUrl: "[^"]*?gid(?:=|\\x3d)(\d+)/g,
    ),
  ];
  const tab = tabs.find(([, name]) => name.trim().toLowerCase() === TAB);
  if (!tab) {
    throw new Error(
      `no published tab named "${TAB}" (found: ${tabs.map(([, n]) => n).join(", ") || "none"})`,
    );
  }

  url.searchParams.set("gid", tab[2]);
  return url;
}

async function fromFeed(speakers: string): Promise<Sponsor[]> {
  const failures: string[] = [];
  const source = await feedFor(speakers);

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    // Each attempt needs its own URL, or it is served the same cached answer.
    const url = new URL(source);
    if (attempt) url.searchParams.set("attempt", String(attempt));

    try {
      const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

      const body = await response.text();
      const trimmed = body.trimStart();
      const sponsors =
        trimmed.startsWith("{") || trimmed.startsWith("[")
          ? fromJson(JSON.parse(body))
          : fromCsv(body);

      if (!sponsors.length) throw new Error("no usable rows in the feed");
      return sponsors;
    } catch (error) {
      failures.push(`attempt ${attempt + 1}: ${(error as Error).message}`);
    }
  }

  throw new Error(failures.join("; "));
}

/** The sponsors, and whether they are the committed placeholder list. */
export async function getSponsors(): Promise<{ sponsors: Sponsor[]; placeholder: boolean }> {
  const committed = { sponsors: COMMITTED, placeholder: COMMITTED_IS_PLACEHOLDER };
  if (!SOURCE) return committed;

  try {
    return { sponsors: await fromFeed(SOURCE), placeholder: false };
  } catch (error) {
    // Never a broken page over a row of logos.
    console.error(
      `[sponsors] could not read the "${TAB}" tab of the sheet, serving the committed sponsors:`,
      error,
    );
    return committed;
  }
}
