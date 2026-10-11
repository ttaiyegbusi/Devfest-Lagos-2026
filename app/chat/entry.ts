/* What the ask panel can answer without asking the server.
 *
 * The FAQ and the tickets are committed files, so they are bundled with the
 * panel: it has something to search the moment it opens, and it still has it
 * when the request for the rest (the schedule and the lineup, which live in a
 * spreadsheet — see knowledge.ts) fails.
 *
 * THE IMPORTS BELOW CARRY THEIR .ts ON PURPOSE. scripts/starters.mjs runs this
 * file under plain Node, which resolves a relative import only when it is
 * spelled in full. Everything reachable from here has to do the same. */
import { FAQS } from "../faq/questions.ts";
import type { Searchable } from "../faq/match.ts";
import { TICKETS } from "../links.ts";
import { TIERS, naira } from "../pricing/tiers.ts";

export type Entry = Searchable & {
  /** A list under the answer, where the answer is one: a day's sessions. */
  lines?: string[];
  /** A path on this site, or a full URL off it. */
  links?: { label: string; href: string }[];
  /** Entries that share a group are offered as each other's follow-ups. */
  group?: string;
};

const BUY = { label: "Buy tickets", href: TICKETS };

function tickets(): Entry[] {
  if (!TIERS.length) return [];
  const group = "Ticketing and Access";
  return [
    {
      group,
      q: "How much is a ticket?",
      a: `${TIERS.map((t) => `${t.name} is ${naira(t.price)} (${t.per})`).join(", and ")}.`,
      tags: ["price", "prices", "pricing", "cost", "fee", "naira", "cheap", "expensive", "pay"],
      links: [BUY],
    },
    ...TIERS.map((t) => ({
      group,
      q: `What is the ${t.name}?`,
      a: `${naira(t.price)} (${t.per}) — ${t.note.toLowerCase()}. ${t.blurb}`,
      lines: t.includes,
      tags: ["pass"],
      links: [BUY],
    })),
  ];
}

export function staticEntries(): Entry[] {
  return [...FAQS, ...tickets()];
}
