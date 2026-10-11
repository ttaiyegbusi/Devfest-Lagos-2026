/* Questions about a time: "What is happening at 12pm on Day 1?"
 *
 * Ranking words cannot answer these. No session says "12pm" — the one running
 * then says "12:00–12:40" — and "3:30" falls inside a session that starts at
 * three. So a question that names a time is not searched at all: the time and
 * the day are read out of it, and the sessions running then are looked up.
 *
 * No imports, like match.ts and for the same reason: scripts/starters.mjs runs
 * this file as it stands. */

export type When = {
  /** Which day, counting from 0, and what the schedule calls it. */
  day: number;
  label: string;
  /** Minutes since midnight. `to` is exclusive. */
  from: number;
  to: number;
};

/* Nothing at a conference happens before eight in the morning, so a bare
   "3:30" or "at 9" is read the way it would be said in the corridor. */
const EARLIEST_HOUR = 8;

function clock(hour: number, minute: number, meridiem?: string): number | null {
  if (hour > 23 || minute > 59) return null;
  let h = hour;
  if (meridiem === "pm" && h < 12) h += 12;
  else if (meridiem === "am" && h === 12) h = 0;
  else if (!meridiem && h < EARLIEST_HOUR) h += 12;
  return h * 60 + minute;
}

/** A time as the sheet writes it — "13:00", "9.30am", "2 pm" — or null. */
export function toMinutes(text: string): number | null {
  const t = text.toLowerCase();
  if (/\b(noon|midday)\b/.test(t)) return 12 * 60;
  const full = /\b(\d{1,2})[:.](\d{2})\s*(am|pm)?/.exec(t);
  if (full) return clock(Number(full[1]), Number(full[2]), full[3]);
  const short = /\b(\d{1,2})\s*(am|pm)\b/.exec(t);
  if (short) return clock(Number(short[1]), 0, short[2]);
  return null;
}

const DAY_NAMES = ["one", "two", "three", "four", "five"];
const DAY_ORDER = ["first", "second", "third", "fourth", "fifth"];

/** The time and the day a question names. Either may be missing. */
export function asked(query: string): { minutes?: number; day?: number } {
  let text = query.toLowerCase();
  let day: number | undefined;

  const numbered = /\bday\s*(\d|one|two|three|four|five)\b/.exec(text);
  const ordered = /\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\s+day\b/.exec(text);
  if (numbered) {
    const n = numbered[1];
    day = /\d/.test(n) ? Number(n) - 1 : DAY_NAMES.indexOf(n);
  } else if (ordered) {
    const n = ordered[1];
    day = /\d/.test(n) ? Number(n[0]) - 1 : DAY_ORDER.indexOf(n);
  }
  // Out of the way, so the 1 of "day 1" is not read as one o'clock.
  const found = numbered ?? ordered;
  if (found) text = text.replace(found[0], " ");

  let minutes = toMinutes(text) ?? undefined;
  if (minutes === undefined) {
    // "at 10", but not "at 13th".
    const bare = /\bat\s+(\d{1,2})\b(?!\s*(?:st|nd|rd|th)\b)/.exec(text);
    if (bare) minutes = clock(Number(bare[1]), 0) ?? undefined;
  }

  return { ...(minutes === undefined ? {} : { minutes }), ...(day === undefined || day < 0 ? {} : { day }) };
}

/** "3:30 PM", for saying the time back. */
export function spoken(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** The entries running at the time `query` names: null when it names no
 *  time, and an empty list when it does and nothing is on. */
export function running<T extends { when?: When }>(
  entries: T[],
  query: string,
): { hits: T[]; minutes: number; day?: number } | null {
  const { minutes, day } = asked(query);
  if (minutes === undefined) return null;
  const hits = entries.filter(
    (e) =>
      e.when &&
      (day === undefined || e.when.day === day) &&
      e.when.from <= minutes &&
      minutes < e.when.to,
  );
  return { hits, minutes, ...(day === undefined ? {} : { day }) };
}
