import local from "./sponsors.json";
import { readTab, rowsOf } from "../sheet/tab";

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
 * tab name — see feedFor() in app/sheet/tab.ts. So the tab has to be called "sponsors", and
 * it has to be published: File → Share → Publish to web, either the entire
 * document or that tab by name.
 *
 * Entries are treated as untrusted: blank cells count as missing, and a row
 * with no name is dropped rather than drawn as an empty gap in the band. */

const SOURCE = process.env.SPEAKERS_URL;

/** The tab, by the name on it. Any capitalisation. */
const TAB = "sponsors";

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

/** A published sheet: one row per sponsor, in the order they should appear. */
const fromCsv = (body: string): Sponsor[] =>
  rowsOf(body).flatMap((record) => {
    const sponsor = toSponsor(record);
    return sponsor ? [sponsor] : [];
  });

const COMMITTED = fromJson(local);

/* The committed file began as invented companies and said so in a _comment
   starting PLACEHOLDER. Exported so the ask panel can decline to name those in
   a sentence — see app/chat/knowledge.ts. A list read from the sheet is never
   a placeholder. */
export const COMMITTED_IS_PLACEHOLDER = [(local as { _comment?: unknown })._comment]
  .flat()
  .join(" ")
  .includes("PLACEHOLDER");

function fromBody(body: string): Sponsor[] {
  const trimmed = body.trimStart();
  const sponsors =
    trimmed.startsWith("{") || trimmed.startsWith("[")
      ? fromJson(JSON.parse(body))
      : fromCsv(body);
  if (!sponsors.length) throw new Error("no usable rows in the feed");
  return sponsors;
}

/** The sponsors, and whether they are the committed placeholder list. */
export async function getSponsors(): Promise<{ sponsors: Sponsor[]; placeholder: boolean }> {
  const committed = { sponsors: COMMITTED, placeholder: COMMITTED_IS_PLACEHOLDER };
  if (!SOURCE) return committed;

  try {
    return { sponsors: await readTab(SOURCE, TAB, fromBody), placeholder: false };
  } catch (error) {
    // Never a broken page over a row of logos.
    console.error(
      `[sponsors] could not read the "${TAB}" tab of the sheet, serving the committed sponsors:`,
      error,
    );
    return committed;
  }
}
