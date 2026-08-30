/* What the ask panel opens with.
 *
 * PLACEHOLDER, like the FAQ it searches — replace both together. Every starter
 * here has to be a question the FAQ can actually answer, which is checked by
 * `npm run check:starters`: a suggested question that returns nothing is worse
 * than no suggestion at all, because the reader concludes the whole thing is
 * broken on their first click.
 *
 * They are also deliberately not phrased as the FAQ phrases them. A suggestion
 * that is the FAQ entry verbatim teaches the reader that only the exact wording
 * works; one that is a natural rewording shows them it does not have to be. */

/** Named in the panel's header, so it is clear what is being asked. */
export const PANEL_NAME = "Ask DevFest";

/** The empty state. Says what this can answer as well as inviting a question:
 *  it searches the event FAQ, and it should not be mistaken for something that
 *  knows the schedule or who is speaking. */
export const GREETING = {
  heading: "Ask about DevFest.",
  note: "Answers come from the event FAQ — tickets, access, and what the two days cover.",
};

export const STARTERS = [
  "When and where is DevFest Lagos 2026?",
  "What does a ticket cover?",
  "Is lunch or swag included?",
  "Can I transfer my ticket?",
  "What should I expect?",
];

/** Shown when the FAQ has nothing. Names the gap rather than apologising, and
 *  the panel offers the whole FAQ underneath it. */
export const NO_ANSWER =
  "I don't have an answer to that one yet. But no worries! Reach out to us on X, Instagram, LinkedIn, or Facebook, and our team will get back to you ASAP. We're here to help!";

/** Greetings that should get a friendly welcome response. */
export const GREETING_KEYWORDS = ["hey", "hi", "hello", "greetings", "what's up", "howdy"];

/** Friendly greeting response. */
export const GREETING_RESPONSE = {
  heading: "Hey there! 👋",
  note: "I'm excited to help! Ask me anything about DevFest Lagos 2026 — whether it's about tickets, what to expect, the venue, or any other questions you have. I'm here for it."
};
