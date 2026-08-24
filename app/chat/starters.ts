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
  "What does a ticket grant me access to?",
  "Is lunch or swag included?",
  "Can I transfer a ticket to someone else?",
];

/** Shown when the FAQ has nothing. Names the gap rather than apologising, and
 *  the panel offers the whole FAQ underneath it. */
export const NO_ANSWER = "Nothing in the FAQ covers that yet.";
