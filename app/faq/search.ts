import { rank } from "./match";
import { FAQS, type Faq } from "./questions";

/* The FAQ section's search.
 *
 * Two things answer questions — this section, and the ask panel — and they
 * must agree, so neither owns the matching: both go through rank() in
 * match.ts. The panel searches more than the FAQ (see app/chat/knowledge.ts);
 * this searches the FAQ alone, because the FAQ is all this section shows. */

/** The FAQ entries that answer `query`, best first. */
export function search(query: string, limit = FAQS.length): Faq[] {
  return rank(FAQS, query, limit);
}
