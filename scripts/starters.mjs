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
import { staticEntries } from "../app/chat/entry.ts";
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

console.log(bad ? `\n${bad} check(s) failed.` : "\nEvery starter is answerable.");
process.exit(bad ? 1 : 0);
