import local from "./sponsors.json";

/* The sponsors band reads its list from sponsors.json next to this file — see
 * the note at the top of it for the fields. Entries are treated as untrusted:
 * blank strings count as missing, and an entry with no name is dropped rather
 * than drawn as an empty gap in the band. */

export type Sponsor = {
  name: string;
  /** A direct URL or a path under public/. Falls back to the name without it. */
  logo?: string;
  /** Where the logo links to. Without it the logo is not a link. */
  url?: string;
};

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

function toSponsor(value: unknown): Sponsor | null {
  const row = (value ?? {}) as Record<string, unknown>;
  const name = text(row.name);
  if (!name) return null;
  const logo = text(row.logo);
  const url = text(row.url);
  return { name, ...(logo ? { logo } : {}), ...(url ? { url } : {}) };
}

const list = (local as { sponsors?: unknown }).sponsors;

export const SPONSORS: Sponsor[] = Array.isArray(list)
  ? list.map(toSponsor).filter((s): s is Sponsor => s !== null)
  : [];
