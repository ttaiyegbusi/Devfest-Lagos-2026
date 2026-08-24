/* The two tickets.
 *
 * Content is real as of the design hand-off; only the destination is shared
 * with the rest of the site (app/links.ts).
 *
 * THESE TICKETS MAKE DEVFEST A TWO-DAY EVENT. "Access to one day" against
 * "access to both days" is the whole difference between them, and the FAQ was
 * still answering that a ticket grants "entry to the venue for the full day"
 * until it was brought in line.
 *
 * WHAT THIS LIST PROMISES IS ALSO PROMISED IN app/faq/questions.ts, under "What
 * does a ticket grant me access to?". They are one promise said twice. Change
 * this list and that answer changes with it, or the site contradicts its own
 * pricing — which is exactly what happened when these tickets first landed, and
 * again when the after party was on the FAQ but on neither ticket. */
export type Tier = {
  name: string;
  /** What the ticket covers, in a few words, set under the name. */
  note: string;
  /** Naira, as an integer. Formatted at the point of use. */
  price: number;
  /** What the price is per, set under it. */
  per: string;
  /** Who the ticket is for. */
  blurb: string;
  includes: string[];
  /** The lanyard ribbon and the bullets — the bright half of the pair. */
  cord: string;
  /** The name and the price — the same hue taken dark enough to read as text. */
  ink: string;
  /** Marks the ticket the section pushes. Exactly one should carry it. */
  featured?: boolean;
};

export const TIERS: Tier[] = [
  {
    name: "Standard Ticket",
    note: "Single day",
    price: 8000,
    per: "per day",
    blurb:
      "Open to everyone — whether you're just starting out or deep in the industry.",
    includes: [
      "Access to all talks and sessions",
      "Access to one day",
      "Access to sponsor booths",
      "Entry to the networking area",
      "Entry to the after party",
    ],
    cord: "#34A853",
    ink: "#123D1F",
  },
  {
    name: "Full Experience",
    note: "Two days full pass",
    price: 16000,
    per: "both days",
    blurb:
      "For those who want more access and a more focused, premium experience across both days.",
    includes: [
      "Access to all talks and sessions",
      "Access to both days",
      "Access to sponsor booths",
      "Entry to the networking area",
      "Entry to the after party",
    ],
    cord: "#4285F4",
    ink: "#1B3A73",
    featured: true,
  },
];

/** Naira, no decimals — these are whole-thousand prices, and ".00" on a ticket
 *  reads like a receipt rather than a price. */
export const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;
