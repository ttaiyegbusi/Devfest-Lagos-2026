/* Every suggested question in the ask panel must return an answer.
 *
 * A starter that finds nothing is the worst possible first click: the reader
 * asked the question the page itself put in front of them, got nothing back,
 * and reasonably concludes the whole panel is broken. Run in CI.
 */
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

// The data files are plain TS with no imports worth resolving, so the arrays
// are lifted out rather than the project being compiled to check three strings.
const faqSrc = read("../app/faq/questions.ts");
const startSrc = read("../app/chat/starters.ts");

const FAQS = [...faqSrc.matchAll(/q:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*a:\s*"((?:[^"\\]|\\.)*)"/g)]
  .map((m) => ({ q: m[1], a: m[2] }));
const STARTERS = [...(/export const STARTERS = \[([\s\S]*?)\];/.exec(startSrc)?.[1] ?? "")
  .matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);

const terms = (q) => q.toLowerCase().split(/\s+/)
  .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")).filter(Boolean);
const hits = (q) => FAQS.filter((f) => {
  const hay = `${f.q} ${f.a}`.toLowerCase();
  return terms(q).every((w) => hay.includes(w));
});

if (FAQS.length === 0 || STARTERS.length === 0) {
  console.error(`could not read the data: ${FAQS.length} faqs, ${STARTERS.length} starters`);
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
