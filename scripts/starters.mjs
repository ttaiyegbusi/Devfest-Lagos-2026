/* Every suggested question in the ask panel must return an answer.
 *
 * A starter that finds nothing is the worst possible first click: the reader
 * asked the question the page itself put in front of them, got nothing back,
 * and reasonably concludes the whole panel is broken. Run in CI.
 *
 * The check is only worth anything if it searches the way the panel searches.
 * It did not, once: this file carried its own copy of the matching and lifted
 * the data out of the sources with regular expressions, the real rules moved
 * on without it, and CI was red for a month over a bug that did not exist.
 *
 * So it no longer has a copy of anything. It imports the panel's own ranking,
 * the panel's own starters and the panel's own bundled entries, which is why
 * those files spell their imports with a .ts — Node strips the types and runs
 * them as they are (`node --experimental-strip-types`, see package.json).
 *
 * What it cannot see is the schedule and the lineup, which come from a
 * spreadsheet at request time. So it checks the FAQ and the tickets, and the
 * starters are kept to questions those can answer.
 */
import { answer, staticEntries } from "../app/chat/entry.ts";
import { STARTERS } from "../app/chat/starters.ts";
import { rank } from "../app/faq/match.ts";

const ENTRIES = staticEntries();

/* The ways people actually ask, which is not how the FAQ is worded. Most of
   these found nothing under the old all-words-must-match rule; they are here
   so that tuning the ranking cannot quietly lose them again. */
const MUST_ANSWER = [
  "How much is a ticket?",
  "ticket price",
  "What time does it start?",
  "Where is the venue?",
  "How do I get to the venue?",
  "Can I get a refund?",
  "How do I volunteer?",
  "How can I become a speaker?",
  "Can I come if I am a designer?",
  "Is food provided?",
  "What is DevFest?",
];

/* And the other half: nothing on the site answers these, so the panel has to
   say so and send them to X. A ranking loose enough to answer them is wrong
   in a way no starter would catch. If the FAQ ever does cover one, move it. */
const MUST_NOT_ANSWER = ["Is there parking?", "Do I need a laptop?", "asdf qwerty"];

if (ENTRIES.length === 0 || STARTERS.length === 0) {
  console.error(`could not read the data: ${ENTRIES.length} entries, ${STARTERS.length} starters`);
  process.exit(1);
}

let bad = 0;
const report = (title, questions, wanted) => {
  console.log(`\n${title}`);
  for (const q of questions) {
    const found = rank(ENTRIES, q);
    const ok = wanted ? found.length > 0 : found.length === 0;
    if (!ok) bad++;
    console.log(`  ${ok ? "ok  " : "FAIL"}  "${q}"`);
    for (const f of found) console.log(`          -> ${f.q}`);
  }
};

console.log(`${STARTERS.length} starters against ${ENTRIES.length} entries`);
report("Starters", STARTERS, true);
report("Natural questions", MUST_ANSWER, true);
report("Questions the site does not answer", MUST_NOT_ANSWER, false);

// And the question mark must not be what decides it.
for (const s of [...STARTERS, ...MUST_ANSWER]) {
  if (rank(ENTRIES, s).length !== rank(ENTRIES, s.replace(/\?$/, "")).length) {
    console.log(`\n  punctuation changes the result for "${s}"`);
    bad++;
  }
}

/* Questions about a time are answered from the clock, not from words. The
   real sessions are in a spreadsheet this cannot see, so a few stand in for
   them: registration and a keynote each day, lunch on the first, a closing and
   the party on the second. */
const session = (q, day, label, from, to, tags = []) => ({ q, a: "", tags, when: { day, label, from, to } });
const TIMED = [
  ...ENTRIES,
  session("Registration", 0, "Day One", 8 * 60, 9 * 60),
  session("Key Note 1", 0, "Day One", 9 * 60 + 50, 10 * 60 + 30, ["Keynote", "keynote"]),
  session("Lunch", 0, "Day One", 12 * 60, 12 * 60 + 40),
  session("Registration", 1, "Day Two", 8 * 60, 9 * 60),
  session("Keynote", 1, "Day Two", 9 * 60 + 15, 9 * 60 + 45, ["Keynote"]),
  session("Closing", 1, "Day Two", 15 * 60, 16 * 60),
  session("Party", 1, "Day Two", 18 * 60, 21 * 60, ["after", "afterparty"]),
  // A speaker whose session is a workshop, so "talk" is not in it.
  {
    q: "Ada Okafor",
    a: "Engineer. Speaking on Day Two. Their session (workshop): “Shipping Agents”, Day Two, 2:00 PM–3:00 PM in Room 3.",
  },
];
const AT = [
  ["What is happening at 12pm on Day 1", "Lunch"],
  ["What is happening at 3:30pm on Day 2", "Closing"],
  ["what's on at 12:30 on day one?", "Lunch"],
  ["What is on at noon?", "Lunch"],
  ["15:30 on the second day", "Closing"],
  ["who is on at 3:30 on day two", "Closing"],
  ["What is happening at 3:30pm on Day 1", "3:30 PM on Day One"],
  // When the event starts is read off the schedule, not the FAQ.
  ["What time does it start?", "When does DevFest Lagos start?"],
  ["What time does the event start?", "When does DevFest Lagos start?"],
  ["when does day 2 start", "When does the day start?"],
  // How long a session runs, by what people call it.
  ["How long will the after party be?", "Party (Day Two)"],
  ["how long is the keynote on day 1", "Key Note 1 (Day One)"],
  ["what time does the party start", "Party (Day Two)"],
  // And a question with no time in it is still a search.
  ["When and where is DevFest Lagos 2026?", "When & where will DevFest Lagos 2026 take place?"],
  ["How do I get to the venue?", "How do I get to the venue?"],
  // A speaker by name, however the session is put.
  ["when is Ada's session", "Ada Okafor"],
  ["what time is Ada's talk", "Ada Okafor"],
  ["when is Ada presenting", "Ada Okafor"],
];
console.log("\nQuestions about a time");
for (const [q, want] of AT) {
  const got = answer(TIMED, q).map((e) => e.q);
  const ok = got.length === 1 && got[0] === want;
  if (!ok) bad++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  "${q}"\n          -> ${got.join(" | ") || "(nothing)"}`);
}

console.log(bad ? `\n${bad} check(s) failed.` : "\nEvery starter is answerable.");
process.exit(bad ? 1 : 0);
