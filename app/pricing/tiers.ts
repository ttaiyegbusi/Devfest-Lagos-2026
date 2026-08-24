/* PLACEHOLDER PRICING — replace every price and perk before launch.
 *
 * The tiers are shaped to agree with what the FAQ already promises. Its answer
 * to "What does a ticket grant me access to?" is "entry to the venue for the
 * full day, all keynote and panel sessions, the product showcase floor, and the
 * after party" — so that is the floor every tier here clears, and the tiers
 * differ above it rather than below. If the real tiers withhold any of that
 * from the cheapest ticket, app/faq/questions.ts has to change with them or the
 * site contradicts itself.
 *
 * `includes` is written so each line reads on its own. Nobody compares three
 * columns cell by cell on a phone; they read the one they think is theirs. */
export type Tier = {
  /** Printed large on the badge. */
  name: string;
  /** What the badge is for, in a few words. */
  note: string;
  /** Naira, as an integer — formatted at the point of use. */
  price: number;
  /** Shown instead of a price where a tier is not simply bought. */
  qualifier?: string;
  includes: string[];
  /** The lanyard ribbon and the badge's accent, from the DevFest palette. */
  cord: string;
  ink: string;
  /** Marks the tier the design pushes. Exactly one should carry it. */
  featured?: boolean;
};

export const TIERS: Tier[] = [
  {
    name: "Student",
    note: "Bring your school ID to the gate",
    price: 5000,
    qualifier: "with a valid student ID",
    includes: [
      "The full day, all sessions",
      "Product showcase floor",
      "The after party",
    ],
    cord: "#4285F4",
    ink: "#1B3A73",
  },
  {
    name: "Community",
    note: "The everyone ticket",
    price: 12000,
    includes: [
      "The full day, all sessions",
      "Product showcase floor",
      "The after party",
      "Lunch on the day",
      "DevFest Lagos T-shirt",
    ],
    cord: "#34A853",
    ink: "#123D1F",
    featured: true,
  },
  {
    name: "Executive",
    note: "For teams and partners",
    price: 60000,
    includes: [
      "Everything in Community",
      "Reserved seating at keynotes",
      "Speaker lounge access",
      "Swag box, posted ahead",
    ],
    cord: "#F9AB00",
    ink: "#5C3E00",
  },
];

/** Naira, no decimals — these are whole-thousand prices and ".00" on a badge
 *  reads like a receipt rather than a price. */
export const naira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;
