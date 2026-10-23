import local from "./team.json";
import { tintFor, type Speaker } from "../speakers/lineup";
import { readTab, rowsOf } from "../sheet/tab";

/* Who puts the thing on.
 *
 * The people come from the tab named "team" in the published Google Sheet that
 * SPEAKERS_URL points at — the same sheet, and the same arrangement, as the
 * sponsors band (see app/sponsors/list.ts). Columns, in any order and any
 * capitalisation:
 *
 *   name, image, role, category
 *
 * Only the name is required. Rows are grouped into squads by category.
 *
 * The squads' headings and blurbs stay in the committed team.json next to this
 * file, because a heading is a line of copy, not a row of data. A category is
 * matched to a heading ignoring case and -ise/-ize spelling, so "Organizing" in
 * the sheet lands under "Organising"; one with no heading in team.json is still
 * drawn, under its own name, after the ones that have one. A heading with no
 * one in it is not drawn.
 *
 * Without SPEAKERS_URL, or when the tab cannot be read, team.json is served
 * whole — headings and people.
 *
 * A person is drawn with exactly the same card as a speaker, so the two pages
 * read as one site. That is why a Member is widened into a Speaker here: the
 * grid asks for an organisation and a team member has none, which is fine —
 * the card leaves that line out when it is empty.
 */

const SOURCE = process.env.SPEAKERS_URL;

/** The tab, by the name on it. Any capitalisation. */
const TAB = "team";

export type Squad = {
  name: string;
  /** One line under the squad's name, saying what it is for. */
  blurb?: string;
  people: Speaker[];
};

export type Team = {
  squads: Squad[];
  headcount: number;
  /** True only when serving a committed file marked PLACEHOLDER. */
  placeholder: boolean;
};

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/* Treated as untrusted, like the lineup: a half-filled row is dropped rather
   than rendered as a nameless card. */
function toMember(row: Record<string, unknown>): Speaker | null {
  const name = text(row.name);
  if (!name) return null;
  const image = text(row.image);
  return {
    name,
    role: text(row.role),
    /* No organisation on a team card — everyone here is the same one. */
    org: "",
    ...(/^https?:\/\//i.test(image) || image.startsWith("/") ? { image } : {}),
    tint: tintFor(name),
  };
}

type Heading = { name: string; blurb?: string };

function fromJson(value: unknown): { headings: Heading[]; squads: Squad[] } {
  const squads = (value as { squads?: unknown })?.squads;
  if (!Array.isArray(squads)) return { headings: [], squads: [] };
  const headings: Heading[] = [];
  const drawn = squads.flatMap((entry) => {
    const squad = entry as {
      name?: unknown;
      blurb?: unknown;
      people?: unknown;
    };
    const name = text(squad.name);
    if (!name) return [];
    const blurb = text(squad.blurb);
    const heading = { name, ...(blurb ? { blurb } : {}) };
    headings.push(heading);

    const people = Array.isArray(squad.people)
      ? squad.people
          .map((p) => toMember(p as Record<string, unknown>))
          .filter((p): p is Speaker => p !== null)
      : [];
    // A squad nobody is in yet is not drawn as an empty heading.
    return people.length ? [{ ...heading, people }] : [];
  });
  return { headings, squads: drawn };
}

/** How a category is compared with a heading: case and -ise/-ize aside. */
const keyOf = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ").replace(/iz/g, "is");

/* One row per person, in the order they should appear within their squad. */
function fromCsv(body: string, headings: Heading[]): Squad[] {
  const groups = new Map<string, { category: string; people: Speaker[] }>();
  for (const record of rowsOf(body)) {
    const person = toMember(record);
    if (!person) continue;
    const category = text(record.category) || text(record.squad) || "Team";
    const key = keyOf(category);
    if (!groups.has(key)) groups.set(key, { category, people: [] });
    groups.get(key)!.people.push(person);
  }
  if (!groups.size) throw new Error("no usable rows in the feed");

  // Headed squads first, in team.json's order; then any the sheet added.
  const headed = headings.flatMap((heading) => {
    const group = groups.get(keyOf(heading.name));
    if (!group) return [];
    groups.delete(keyOf(heading.name));
    return [{ ...heading, people: group.people }];
  });
  const unheaded = [...groups.values()].map(({ category, people }) => ({
    name: category,
    people,
  }));
  return [...headed, ...unheaded];
}

const COMMITTED = fromJson(local);

/* See app/sponsors/list.ts: a committed file of invented names says so in a
   _comment starting PLACEHOLDER, and the ask panel declines to repeat it. */
const COMMITTED_IS_PLACEHOLDER = [(local as { _comment?: unknown })._comment]
  .flat()
  .join(" ")
  .includes("PLACEHOLDER");

const teamOf = (squads: Squad[], placeholder: boolean): Team => ({
  squads,
  headcount: squads.reduce((sum, squad) => sum + squad.people.length, 0),
  placeholder,
});

export async function getTeam(): Promise<Team> {
  const committed = teamOf(COMMITTED.squads, COMMITTED_IS_PLACEHOLDER);
  if (!SOURCE) return committed;

  try {
    const squads = await readTab(SOURCE, TAB, (body) => fromCsv(body, COMMITTED.headings));
    return teamOf(squads, false);
  } catch (error) {
    // Never a broken page over a list of names.
    console.error(
      `[team] could not read the "${TAB}" tab of the sheet, serving the committed team:`,
      error,
    );
    return committed;
  }
}
