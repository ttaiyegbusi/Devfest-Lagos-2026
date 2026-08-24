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
    ],
    cord: "#4285F4",
    ink: "#1B3A73",
    featured: true,
  },
];

/** Naira, no decimals — these are whole-thousand prices, and ".00" on a ticket
 *  reads like a receipt rather than a price. */
export const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;
