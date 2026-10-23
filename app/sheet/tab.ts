/* Reading a named tab of the published Google Sheet that SPEAKERS_URL points
 * at. Shared by the sponsors band and the team page, which both live in that
 * one sheet rather than having a variable each.
 *
 * See app/sponsors/list.ts for why there is no SPONSORS_URL or TEAM_URL, and
 * app/speakers/lineup.ts for the long version of how a published tab is read
 * and why it is distrusted. */

const REVALIDATE_SECONDS = 300;

/* A spreadsheet error, published. See app/schedule/agenda.ts: a feed carrying
   one is a feed mid-recalculation, and is treated like one that could not be
   fetched. */
export const SHEET_ERRORS = new Set([
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
export function splitRow(line: string): string[] {
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

/** A published tab as one record per row, keyed by its lower-cased headers. */
export function rowsOf(body: string): Record<string, string>[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((row) => {
    const cells = splitRow(row);
    const broken = cells.find((c) => SHEET_ERRORS.has(c.trim().toUpperCase()));
    if (broken) throw new Error(`the feed carries a spreadsheet error (${broken})`);

    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = cells[i] ?? "";
    });
    return record;
  });
}

/* A tab's address, worked out from the speakers tab's.
 *
 * .../pub?gid=123&single=true&output=csv is one tab; the same address with
 * another gid is another. The gids are listed, by tab name, in the script of
 * the sheet's published index page (.../pubhtml), which is what Google's own
 * tab bar is drawn from.
 *
 * That page is not an API and its markup is Google's to change. If it does,
 * this throws, the committed file is served, and the reason is in the log —
 * the same as any other feed that cannot be read. */
export async function feedFor(speakers: string, tabName: string): Promise<URL> {
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
  const tab = tabs.find(([, name]) => name.trim().toLowerCase() === tabName);
  if (!tab) {
    throw new Error(
      `no published tab named "${tabName}" (found: ${tabs.map(([, n]) => n).join(", ") || "none"})`,
    );
  }

  url.searchParams.set("gid", tab[2]);
  return url;
}

/* Google serves a published tab from a cache that does not always agree with
   itself, so one request decides nothing. See app/schedule/agenda.ts. */
const ATTEMPTS = 3;

/** The named tab's rows, parsed by `read`, which throws on an unusable feed. */
export async function readTab<T>(
  speakers: string,
  tabName: string,
  read: (body: string) => T,
): Promise<T> {
  const failures: string[] = [];
  const source = await feedFor(speakers, tabName);

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    // Each attempt needs its own URL, or it is served the same cached answer.
    const url = new URL(source);
    if (attempt) url.searchParams.set("attempt", String(attempt));

    try {
      const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return read(await response.text());
    } catch (error) {
      failures.push(`attempt ${attempt + 1}: ${(error as Error).message}`);
    }
  }

  throw new Error(failures.join("; "));
}
