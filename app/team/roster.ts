import local from "./team.json";
import { tintFor, type Speaker } from "../speakers/lineup";

/* Who puts the thing on.
 *
 * The roster comes from the committed team.json next to this file: edit it,
 * commit, and the next deploy carries it. There is no remote source here, the
 * way the lineup and the schedule have one — a lineup changes weekly right up
 * to the event and wants a spreadsheet behind it, whereas the organising team
 * is settled months out and changes about twice. If that stops being true,
 * app/speakers/lineup.ts has the pattern to copy.
 *
 * A person is drawn with exactly the same card as a speaker, so the two pages
 * read as one site. That is why a Member is widened into a Speaker here: the
 * grid asks for an organisation and a team member has none, which is fine —
 * the card leaves that line out when it is empty.
 */

export type Squad = {
  name: string;
  /** One line under the squad's name, saying what it is for. */
  blurb?: string;
  people: Speaker[];
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
    ...(image ? { image } : {}),
    tint: tintFor(name),
  };
}

function fromJson(value: unknown): Squad[] {
  const squads = (value as { squads?: unknown })?.squads;
  if (!Array.isArray(squads)) return [];
  return squads.flatMap((entry) => {
    const squad = entry as {
      name?: unknown;
      blurb?: unknown;
      people?: unknown;
    };
    const name = text(squad.name);
    const people = Array.isArray(squad.people)
      ? squad.people
          .map((p) => toMember(p as Record<string, unknown>))
          .filter((p): p is Speaker => p !== null)
      : [];
    // A squad nobody is in yet is not drawn as an empty heading.
    if (!name || !people.length) return [];
    const blurb = text(squad.blurb);
    return [{ name, ...(blurb ? { blurb } : {}), people }];
  });
}

export const SQUADS: Squad[] = fromJson(local);

export const HEADCOUNT = SQUADS.reduce(
  (sum, squad) => sum + squad.people.length,
  0,
);
