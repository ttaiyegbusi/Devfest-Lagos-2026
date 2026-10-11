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
import { rank, type Searchable } from "../faq/match.ts";
import { TICKETS } from "../links.ts";
import { TIERS, naira } from "../pricing/tiers.ts";
import { running, spoken, type When } from "./when.ts";

export type Entry = Searchable & {
  /** A list under the answer, where the answer is one: a day's sessions. */
  lines?: string[];
  /** A path on this site, or a full URL off it. */
  links?: { label: string; href: string }[];
  /** Entries that share a group are offered as each other's follow-ups. */
  group?: string;
  /** On a session: when it runs, so it can be found by the clock. */
  when?: When;
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

/* A time can fall across four rooms on each of two days. */
const AT_ONCE = 8;

/** What the panel says to `question`. The one way in, so the panel and the
 *  check in scripts/starters.mjs cannot answer differently.
 *
 *  A question that names a time is answered from the clock (see when.ts),
 *  anything else by ranking. A time when nothing is on gets told so, rather
 *  than falling through to "I don't have an answer": the schedule does have
 *  the answer, and the answer is nothing. */
export function answer(entries: Entry[], question: string): Entry[] {
  const sessions = entries.filter((e) => e.when);
  const timed = sessions.length ? running(sessions, question) : null;
  if (!timed) return rank(entries, question);
  if (timed.hits.length) return timed.hits.slice(0, AT_ONCE);

  const label =
    timed.day === undefined
      ? ""
      : ` on ${sessions.find((e) => e.when?.day === timed.day)?.when?.label ?? "that day"}`;
  return [
    {
      q: `${spoken(timed.minutes)}${label}`,
      a: `Nothing is on the schedule at ${spoken(timed.minutes)}${label}.`,
      links: [{ label: "See the full schedule", href: "/schedule" }],
    },
  ];
}
