/* PLACEHOLDER SPONSORS — these companies have NOT sponsored anything.
 *
 * They are recognisable names standing in for the real list until the logos
 * arrive, and they are a claim about somebody else: a live page saying Meta or
 * Netflix backs DevFest Lagos is saying it on their behalf. Replace every entry
 * here before the site is public. Google is the one name with a genuine claim
 * to be here — DevFest is a Google Developer Group event — and even that should
 * be confirmed rather than assumed.
 *
 * TO WIRE UP: drop an SVG or WebP in public/sponsors/ and set `logo`. Until
 * then each name is set as type, which is also what a real sponsor gets while
 * their file is outstanding — a missing logo should never be a broken image. */
export type Sponsor = {
  name: string;
  /** e.g. "/sponsors/google.svg". Falls back to the name until it exists. */
  logo?: string;
};

export const SPONSORS: Sponsor[] = [
  { name: "Google" },
  { name: "Microsoft" },
  { name: "X" },
  { name: "Facebook" },
  { name: "Amazon" },
  { name: "Netflix" },
  { name: "Spotify" },
  { name: "GitHub" },
  { name: "Figma" },
  { name: "Stripe" },
  { name: "Paystack" },
  { name: "Flutterwave" },
  { name: "Moniepoint" },
  { name: "Andela" },
];
