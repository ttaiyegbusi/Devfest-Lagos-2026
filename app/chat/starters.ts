/* What the ask panel opens with, and what it says when it has nothing.
 *
 * Every starter here has to be a question the panel can actually answer, which
 * is checked by `npm run check:starters`: a suggested question that returns
 * nothing is worse than no suggestion at all, because the reader concludes the
 * whole thing is broken on their first click. The check runs against the FAQ
 * and the tickets — the committed files — so a starter has to be answerable
 * from those, not from the schedule or the lineup, which live in a spreadsheet
 * the check cannot see.
 *
 * They are also deliberately not phrased as the FAQ phrases them. A suggestion
 * that is the FAQ entry verbatim teaches the reader that only the exact wording
 * works; one that is a natural rewording shows them it does not have to be.
 *
 * The import carries its .ts because scripts/starters.mjs runs this file under
 * plain Node — see the note in entry.ts. */
import { SOCIALS } from "../links.ts";

/** Named in the panel's header, so it is clear what is being asked. */
export const PANEL_NAME = "Ask DevFest";

/** The empty state. Says where the answers come from as well as inviting a
 *  question: this looks things up on the site, it does not make things up. */
export const GREETING = {
  heading: "Ask about DevFest.",
  note: "Answers come from this site — the FAQ, the tickets, the schedule and the speakers.",
};

export const STARTERS = [
  "When and where is DevFest Lagos 2026?",
  "How much is a ticket?",
  "What does a ticket cover?",
  "Is lunch or swag included?",
  "Can I transfer my ticket?",
];

/* Where a question goes when the site cannot answer it: to the people who
   can. The handle is read off the account's address in links.ts rather than
   typed again, so the two cannot come apart. */
export const X_HANDLE = `@${new URL(SOCIALS.X).pathname.replace(/^\/+|\/+$/g, "")}`;

/** A post to GDG Lagos with the question already written, so asking them is
 *  one tap and not a retyping. */
export const askOnX = (question: string) =>
  `https://x.com/intent/post?text=${encodeURIComponent(`${X_HANDLE} ${question}`)}`;

/** Shown when nothing answers. Names the gap rather than apologising, and the
 *  panel sets the link to X after it. */
export const NO_ANSWER = {
  lead: "I don't have an answer to that one yet.",
  ask: `Ask us on X at ${X_HANDLE}`,
  after: "and the team will get back to you.",
};

/** Greetings that should get a welcome rather than a search. */
export const GREETING_KEYWORDS = [
  "hey", "hi", "hello", "greetings", "what's up", "howdy",
  "good morning", "good afternoon", "good evening",
];

export const GREETING_RESPONSE = {
  heading: "Hey there! 👋",
  note: "Ask about DevFest Lagos 2026 — tickets, the venue, the schedule or who is speaking — and I'll find what the site says.",
};
