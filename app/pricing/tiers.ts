/* The two tickets.
 *
 * Content is real as of the design hand-off; only the destination is shared
 * with the rest of the site (app/links.ts).
 *
 * THESE TICKETS MAKE DEVFEST A TWO-DAY EVENT. "Access to one day" and "access
 * to both days" are the whole difference between them, and nothing else on the
 * site knows that yet: the FAQ still answers that a ticket grants "entry to the
 * venue for the full day", and panel 01 still says "all day". Those need to be
 * brought in line or the site contradicts its own pricing — flagged rather than
 * quietly rewritten, because that copy is not mine to invent. */
export type Tier = {
  /** The small pill above the name — what the ticket covers, in a few words. */
  label: string;
  name: string;
  /** Naira, as an integer. Formatted at the point of use. */
  price: number;
  /** What the price is per, set beside it. */
  per: string;
  /** Who the ticket is for. */
  blurb: string;
  includes: string[];
  /** Card ground and the accent its pill and cord take. */
  paper: string;
  accent: string;
};

export const TIERS: Tier[] = [
  {
    label: "Single day",
    name: "Standard Ticket",
    price: 8000,
    per: "per day",
    blurb:
      "Open to everyone — whether you're just starting out or deep in the industry.",
    includes: [
      "Access to all talks and sessions",
      "Access to one day",
      "Access to sponsor booths",
      "Entry to the networking area",
    ],
    paper: "#d7f0c4",
    accent: "#2f7d32",
  },
  {
    label: "Two days full pass",
    name: "Full Experience",
    price: 16000,
    per: "both days",
    blurb:
      "For those who want more access and a more focused, premium experience across both days.",
    includes: [
      "Access to all talks and sessions",
      "Access to both days",
      "Access to sponsor booths",
      "Entry to the networking area",
    ],
    paper: "#c8e7f5",
    accent: "#1a56b8",
  },
];

/** Naira, no decimals — these are whole-thousand prices, and ".00" on a ticket
 *  reads like a receipt rather than a price. */
export const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;
