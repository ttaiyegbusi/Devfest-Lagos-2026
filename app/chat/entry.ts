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
import { rank, terms, type Searchable } from "../faq/match.ts";
import { TICKETS, VENUE_MAP } from "../links.ts";
import { TIERS, naira } from "../pricing/tiers.ts";
import { dayIn, lasting, running, spoken, type When } from "./when.ts";

export type Entry = Searchable & {
  /** A list under the answer, where the answer is one: a day's sessions. */
  lines?: string[];
  /** A path on this site, or a full URL off it. */
  links?: { label: string; href: string }[];
  /** Entries that share a group are offered as each other's follow-ups. */
  group?: string;
  /** On a session: when it runs, so it can be found by the clock. */
  when?: When;
  /** When this leads, it is the whole answer: nothing ranked under it. */
  alone?: boolean;
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

/* The answer to getting there is the map, and only the map: the venue's name
   and the dates are the FAQ's answer, a question away. Ahead of the FAQ so
   that "how do I get to the venue?", which both match, leads with the way. */
function directions(): Entry[] {
  return [
    {
      q: "How do I get to the venue?",
      a: "",
      alone: true,
      tags: [
        "directions", "direction", "venue", "map", "maps", "route", "navigate", "landmark",
        "reach", "locate", "find", "transport", "drive", "uber", "bolt",
      ],
      links: [{ label: "Landmark Event Centre on Google Maps", href: VENUE_MAP }],
    },
  ];
}

export function staticEntries(): Entry[] {
  return [...directions(), ...FAQS, ...tickets()];
}

/* A time can fall across four rooms on each of two days. */
const AT_ONCE = 8;

const SCHEDULE = { label: "See the full schedule", href: "/schedule" };

const STARTS = /\b(?:start|starts|starting|begin|begins|beginning|commence|commences|kick\s*off|kicks\s*off|open|opens)\b/;
const HOW_LONG = /\bhow\s+long\b|\bduration\b|\bhow\s+many\s+(?:hours|minutes|mins)\b|\blength\b/;
/* Verbs that come with "how long" and ask nothing of their own. */
const LASTS = /\b(?:last|lasts|run|runs|go\s+on(?:\s+for)?|take|takes)\b/g;

/* Words that name the event as a whole rather than anything in it: "when does
   the event start?" is about the day, "when does the keynote start?" is about
   the keynote. Run through terms() a word at a time, so they are stemmed the
   way a question's words are and the event's own name is not dropped. */
const WHOLE = new Set(
  "event conference festival fest devfest lagos 2026 day days each programme program thing things doors morning first session time when"
    .split(" ")
    .flatMap((w) => terms(w)),
);
const isWhole = (text: string) => terms(text).every((t) => WHOLE.has(t));

type Timed = Entry & { when: When };

/** Each day's sessions in the order they run, `day` alone if one is named. */
function days(sessions: Timed[], day?: number): Timed[][] {
  const by = new Map<number, Timed[]>();
  for (const s of sessions) {
    if (day !== undefined && s.when.day !== day) continue;
    by.set(s.when.day, [...(by.get(s.when.day) ?? []), s]);
  }
  return [...by.keys()]
    .sort((a, b) => a - b)
    .map((d) => by.get(d)!.sort((a, b) => a.when.from - b.when.from));
}

const onDay = (sessions: Timed[], day?: number) =>
  day === undefined ? sessions : sessions.filter((s) => s.when.day === day);

/* Registration is when the doors open, not when the programme does, so a day
   that begins with it is said as both. */
const isArrival = (q: string) => /registration|check-?in|arrival|doors/i.test(q);

function starts(day: Timed[]): string {
  const [first, ...rest] = day;
  const label = first.when.label;
  const opening = isArrival(first.q) ? rest[0] : undefined;
  return opening
    ? `${label}: ${first.q.toLowerCase()} opens at ${spoken(first.when.from)}, and the first session (${opening.q}) starts at ${spoken(opening.when.from)}.`
    : `${label}: the first session (${first.q}) starts at ${spoken(first.when.from)}.`;
}

/* From the first session's start to the last one's end. A last session with
   no end time is counted to its start, since how long it runs is a guess. */
function spans(day: Timed[]): string {
  const from = day[0].when.from;
  const to = Math.max(...day.map((s) => (s.when.guessed ? s.when.from : s.when.to)));
  return `${day[0].when.label}: ${spoken(from)} to ${spoken(to)}, ${lasting(to - from)}.`;
}

/** One answer made of a line per day, or the line itself for one day. */
function perDay(q: string, said: string[]): Entry[] {
  if (!said.length) return [];
  return [
    said.length === 1
      ? { q, a: said[0], links: [SCHEDULE] }
      : { q, a: "From the schedule:", lines: said, links: [SCHEDULE] },
  ];
}

/** "What time does the event start?" — from the schedule, not the FAQ's
 *  round number — or "when does the keynote start?", each session it names.
 *  Null when the question is about something else. */
function whenItStarts(sessions: Timed[], question: string): Entry[] | null {
  const { day, rest } = dayIn(question);
  if (!STARTS.test(rest)) return null;
  const subject = rest.replace(STARTS, " ");

  if (isWhole(subject)) {
    const said = days(sessions, day).map(starts);
    return said.length ? perDay(day === undefined ? "When does DevFest Lagos start?" : "When does the day start?", said) : null;
  }

  const hits = rank(onDay(sessions, day), subject, AT_ONCE);
  if (!hits.length) return null;
  return hits.map(({ q, when }) => ({
    q: `${q} (${when.label})`,
    a: `Starts at ${spoken(when.from)} on ${when.label}${when.guessed ? "" : `, and runs until ${spoken(when.to)}`}.`,
    links: [SCHEDULE],
  }));
}

/** "How long is the keynote on Day 1?" — each session it names and its
 *  length, or each day's length when it names only the event. Null when the
 *  question is about something else, or names nothing on the schedule. */
function howLong(sessions: Timed[], question: string): Entry[] | null {
  const { day, rest } = dayIn(question);
  if (!HOW_LONG.test(rest)) return null;
  const subject = rest.replace(HOW_LONG, " ").replace(LASTS, " ");

  if (isWhole(subject)) {
    const said = days(sessions, day).map(spans);
    return said.length ? perDay("How long does DevFest Lagos run?", said) : null;
  }

  const hits = rank(onDay(sessions, day), subject, AT_ONCE);
  if (!hits.length) return null;
  return hits.map(({ q, when }) => ({
    q: `${q} (${when.label})`,
    a: when.guessed
      ? `Starts at ${spoken(when.from)} on ${when.label}. The schedule does not say when it ends.`
      : `${lasting(when.to - when.from)}: ${spoken(when.from)} to ${spoken(when.to)} on ${when.label}.`,
    links: [SCHEDULE],
  }));
}

/** What the panel says to `question`. The one way in, so the panel and the
 *  check in scripts/starters.mjs cannot answer differently.
 *
 *  A question about when the event starts or how long something runs is
 *  answered from the schedule's clock, as is one that names a time (see
 *  when.ts); anything else by ranking. A time when nothing is on gets told so, rather
 *  than falling through to "I don't have an answer": the schedule does have
 *  the answer, and the answer is nothing. */
export function answer(entries: Entry[], question: string): Entry[] {
  const sessions = entries.filter((e): e is Timed => e.when !== undefined);
  if (sessions.length) {
    const found = whenItStarts(sessions, question) ?? howLong(sessions, question);
    if (found) return found;
  }
  const timed = sessions.length ? running(sessions, question) : null;
  if (!timed) {
    const hits = rank(entries, question);
    return hits[0]?.alone ? hits.slice(0, 1) : hits;
  }
  if (timed.hits.length) return timed.hits.slice(0, AT_ONCE);

  const label =
    timed.day === undefined
      ? ""
      : ` on ${sessions.find((e) => e.when?.day === timed.day)?.when?.label ?? "that day"}`;
  return [
    {
      q: `${spoken(timed.minutes)}${label}`,
      a: `Nothing is on the schedule at ${spoken(timed.minutes)}${label}.`,
      links: [SCHEDULE],
    },
  ];
}
