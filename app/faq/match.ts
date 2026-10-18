/* How a question is matched to an answer.
 *
 * NO IMPORTS, ON PURPOSE. scripts/starters.mjs runs this file as it stands, so
 * the check and the site cannot disagree about what a question finds. They did
 * once: the script carried its own copy of these rules, the rules here moved
 * on, and CI was red for a month over a bug that did not exist.
 *
 * It ranks rather than filters. The first version wanted every word of the
 * question somewhere in the entry, which sounds strict and reads as broken:
 * "Can I get a refund?" found nothing, because no answer says "can" or "get",
 * while the bare word "refund" found two. People ask in sentences. */

export type Searchable = {
  q: string;
  a: string;
  /** Words people use for this that the copy itself does not. Searched, never
   *  shown. */
  tags?: string[];
};

/** The grammar of a question, which says nothing about what it is asking. */
export const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in",
  "is", "it", "its", "of", "on", "or", "that", "the", "to", "was", "will", "with",
  "about", "all", "also", "any", "been", "but", "can", "cant", "could", "did", "does",
  "doing", "dont", "going", "happen", "happening", "have", "her", "him", "his", "how", "into", "just", "may", "not",
  "our", "out", "she", "should", "some", "than", "their", "them", "then", "there",
  "these", "they", "this", "too", "what", "whats", "which", "would", "you", "your",
  "available", "come", "get", "know", "like", "need", "offer", "offered", "please",
  "provide", "provided", "tell", "want",
]);

/* Words that separate nothing when there is anything else to go on. The
   event's name is in nearly every question and nearly every answer; "when",
   "where" and "time" ask for a fact the right entry holds without using the
   word — "When is the keynote?" is a question about the keynote. They are
   dropped only when the question has something else in it: "What is DevFest?"
   and "When and where is it?" are made of nothing else, and deserve answers.

   The same goes for the words for a session: "when is Sebastine's talk?" is a
   question about Sebastine, whether the schedule calls it a talk, a workshop
   or a panel, and "when is Chisom presenting?" no less. */
const WEAK_WORDS = new Set([
  "devfest", "lagos", "2026", "when", "where", "time",
  "session", "sessions", "talk", "talks", "talking", "present", "presenting", "presentation",
  "presentations",
]);

const NUMBER = /^\p{N}+$/u;

/** Text as bare lower-case words. An apostrophe is dropped rather than split
 *  on, so "can't" is one word on both sides of the match. */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .replace(/[’']/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Rough, and only ever compared with itself: "tickets" and "ticket",
 *  "included" and "includes", "pricing" and "price" come out alike. */
function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) w = `${w.slice(0, -3)}y`;
  else if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

/** The words of a question that have to be found. */
export function terms(query: string): string[] {
  const kept = words(query).filter(
    (w) => (w.length >= 3 || NUMBER.test(w)) && !STOP_WORDS.has(w),
  );
  const specific = kept.filter((w) => !WEAK_WORDS.has(w));
  return [...new Set((specific.length ? specific : kept).map(stem))];
}

/* A whole word, or the start of one, so "refund" finds "refundable". Numbers
   are matched whole: "1" is not the start of "13th". */
const has = (hay: string[], term: string) =>
  hay.some((h) => h === term || (!NUMBER.test(term) && h.startsWith(term)));

/* A word found in the question or the tags counts three times one found only
   in the answer: someone who asks about lunch means the entry about lunch, not
   the one that mentions it in passing. */
const IN_QUESTION = 3;
const IN_ANSWER = 1;

/** How much of a question an entry has to cover. One stray word in three is
 *  forgiven; one in two is not, or half a question would answer anything. */
const COVERAGE = 0.6;

/** Entries scoring under this share of the best one are left out, so a close
 *  answer is not buried under three loose ones. */
const NEAR_BEST = 0.8;

/** The entries that answer `query`, best first. */
export function rank<T extends Searchable>(entries: T[], query: string, limit = 3): T[] {
  const wanted = terms(query);
  if (!wanted.length) return [];
  const need = Math.ceil(wanted.length * COVERAGE);

  const scored = entries
    .map((entry, index) => {
      const strong = words(`${entry.q} ${(entry.tags ?? []).join(" ")}`).map(stem);
      const weak = words(entry.a).map(stem);
      let score = 0;
      let covered = 0;
      for (const term of wanted) {
        if (has(strong, term)) score += IN_QUESTION;
        else if (has(weak, term)) score += IN_ANSWER;
        else continue;
        covered++;
      }
      return { entry, score, covered, index };
    })
    .filter((s) => s.covered >= need)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  if (!scored.length) return [];
  const floor = scored[0].score * NEAR_BEST;
  return scored
    .filter((s) => s.score >= floor)
    .slice(0, limit)
    .map((s) => s.entry);
}
