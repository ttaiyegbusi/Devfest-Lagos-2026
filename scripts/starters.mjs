/* Every suggested question in the ask panel must return an answer.
 *
 * A starter that finds nothing is the worst possible first click: the reader
 * asked the question the page itself put in front of them, got nothing back,
 * and reasonably concludes the whole panel is broken. Run in CI.
 *
 * The check is only worth anything if it searches the way the panel searches.
 * It did not: this file carried its own matching — every word of the question
 * had to appear as a substring somewhere in the entry — while app/faq/search.ts
 * had moved on to dropping stop words and short words and matching on word
 * boundaries. So the two starters whose wording differs most from their FAQ
 * ("When and where is DevFest Lagos 2026?" against "When & where will DevFest
 * Lagos 2026 take place?") failed here and worked in the panel, and CI was red
 * for a month over a bug that did not exist.
 *
 * The rules below are now the ones in search.ts, with its stop words lifted
 * from the file rather than retyped, so adding one there cannot quietly change
 * what this checks.
 */
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

// The data files are plain TS with no imports worth resolving, so the arrays
// are lifted out rather than the project being compiled to check three strings.
const faqSrc = read("../app/faq/questions.ts");
const startSrc = read("../app/chat/starters.ts");
const searchSrc = read("../app/faq/search.ts");

const FAQS = [...faqSrc.matchAll(/q:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*a:\s*"((?:[^"\\]|\\.)*)"/g)]
  .map((m) => ({ q: m[1], a: m[2] }));
const STARTERS = [...(/export const STARTERS = \[([\s\S]*?)\];/.exec(startSrc)?.[1] ?? "")
  .matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);

const STOP_WORDS = new Set(
  [...(/const STOP_WORDS = new Set\(\[([\s\S]*?)\]\)/.exec(searchSrc)?.[1] ?? "")
    .matchAll(/"([^"]+)"/g)].map((m) => m[1]),
);

/* terms() and matches(), as app/faq/search.ts defines them. */
const terms = (q) => q.toLowerCase().split(/\s+/)
  .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
  .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
const hits = (q) => FAQS.filter((f) => {
  const hayWords = `${f.q} ${f.a}`.toLowerCase()
    .split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return terms(q).every((w) => hayWords.some((hw) => hw === w || hw.startsWith(w)));
});

// A regex that quietly stops matching would turn this check into one that
// always passes, so an empty lift is a failure rather than a clean run.
if (FAQS.length === 0 || STARTERS.length === 0 || STOP_WORDS.size === 0) {
  console.error(
    `could not read the data: ${FAQS.length} faqs, ${STARTERS.length} starters, ` +
      `${STOP_WORDS.size} stop words`,
  );
  process.exit(1);
}

let bad = 0;
console.log(`${STARTERS.length} starters against ${FAQS.length} FAQ entries\n`);
for (const s of STARTERS) {
  const found = hits(s);
  if (found.length === 0) bad++;
  console.log(`  ${found.length ? "ok  " : "NONE"}  "${s}"`);
  for (const f of found) console.log(`          -> ${f.q}`);
}
// And the question mark must not be what decides it.
for (const s of STARTERS) {
  if (hits(s).length !== hits(s.replace(/\?$/, "")).length) {
    console.log(`\n  punctuation changes the result for "${s}"`); bad++;
  }
}
console.log(bad ? `\n${bad} starter(s) answer nothing.` : "\nEvery starter is answerable.");
process.exit(bad ? 1 : 0);
