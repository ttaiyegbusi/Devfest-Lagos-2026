/* PLACEHOLDER SPONSORS — replace before launch.
 *
 * Names are invented and no logo files exist yet: every entry falls back to its
 * name set as type, which is also what a real sponsor gets until their file is
 * dropped in. Nobody should have to wait for artwork to see the section laid
 * out, and a missing logo should never be a broken image.
 *
 * TO WIRE UP: drop an SVG or WebP in public/sponsors/ and set `logo` to its
 * path. Keep the real names — sending people to the wrong company, or crediting
 * one that has not signed, is worse than a slower launch. */
export type Sponsor = {
  name: string;
  /** e.g. "/sponsors/google.svg". Falls back to the name until it exists. */
  logo?: string;
  href?: string;
};

export type Tier = {
  heading: string;
  /** How prominent the row is: bigger for the tiers that paid for it. */
  scale: "lead" | "major" | "supporting";
  sponsors: Sponsor[];
};

export const SPONSOR_TIERS: Tier[] = [
  {
    heading: "Headline",
    scale: "lead",
    sponsors: [{ name: "Google" }, { name: "Placeholder Bank" }],
  },
  {
    heading: "Partners",
    scale: "major",
    sponsors: [
      { name: "Placeholder Cloud" },
      { name: "Placeholder Pay" },
      { name: "Placeholder Labs" },
    ],
  },
  {
    heading: "Supported by",
    scale: "supporting",
    sponsors: [
      { name: "Placeholder Studio" },
      { name: "Placeholder Foundry" },
      { name: "Placeholder Works" },
      { name: "Placeholder Collective" },
      { name: "Placeholder Group" },
    ],
  },
];
