import { FAQS, type Faq } from "./questions";

/* The one place a question is turned into an answer.
 *
 * Two things search the FAQ — the section itself, and the hero's ask panel —
 * and they must agree. A second copy of this would drift the first time either
 * was tuned, and "the FAQ found it but the chat did not" is a bug nobody would
 * think to look for. */

/** Common stop words that don't help search but often appear in natural questions. */
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in",
  "is", "it", "its", "of", "on", "or", "that", "the", "to", "was", "will", "with",
]);

/** Split a question into the words that have to be found.
 *
 * Punctuation is trimmed off each end. The ask panel invites a question and
 * people type the question mark; "tickets?" appears in no answer ever written,
 * so without this the most natural way to ask is the one way that finds
 * nothing. Trimmed rather than split on, so "can't" stays one word.
 *
 * Stop words (common words like "is", "and") are filtered out so natural
 * questions find answers even when phrased differently from the FAQ. */
export function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

/** Every word of the query has to appear as a whole word (or the start of one)
 *  somewhere in the entry. Prefix matching lets "ticket" find "tickets". */
export function matches(haystack: string, query: string): boolean {
  const hay = haystack.toLowerCase();
  const hayWords = hay.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return terms(query).every((word) =>
    hayWords.some((hw) => hw === word || hw.startsWith(word)),
  );
}

/** The entries that answer `query`, best first.
 *
 * "Best" is only ever a tie-break here: a hit in the question itself beats one
 * that is buried in an answer, because someone who asks about lunch means the
 * entry titled lunch, not the one that mentions it in passing. */
export function search(query: string): Faq[] {
  const words = terms(query);
  if (words.length === 0) return [];
  return FAQS.filter((f) => matches(`${f.q} ${f.a}`, query)).sort((a, b) => {
    const score = (f: Faq) => {
      const qWords = f.q.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
      return words.filter((w) => qWords.some((qw) => qw === w || qw.startsWith(w))).length;
    };
    return score(b) - score(a);
  });
}
