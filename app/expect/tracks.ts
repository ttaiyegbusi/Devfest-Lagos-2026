// The four things the day is made of. Copy is placeholder below the titles —
// swap the blurbs once the programme is confirmed.
export type Track = {
  n: string;
  title: string;
  blurb: string;
  /** Card fill. */
  bg: string;
  /** Ink that reads on that fill. */
  ink: string;
  /** Fan angle, in degrees. */
  tilt: number;
  /** Vertical nudge, in px, so the fan doesn't sit on one baseline. */
  lift: number;
};

export const TRACKS: Track[] = [
  {
    n: "01",
    title: "Panel Sessions\nand Global\nKeynotes",
    blurb:
      "Explore topics across software engineering, product design, data, cybersecurity, career growth, and more. Ask questions, gain practical insights, and leave with knowledge you can apply immediately.",
    bg: "#9A7BD0",
    ink: "#221635",
    tilt: -3.4,
    lift: 18,
  },
  {
    n: "02",
    title: "Hands on\nWorkshops",
    blurb:
      "Explore topics across software engineering, product design, data, cybersecurity, career growth, and more. Ask questions, gain practical insights, and leave with knowledge you can apply immediately.",
    bg: "#EF4E22",
    ink: "#ffffff",
    tilt: 4,
    lift: 0,
  },
  {
    n: "03",
    title: "Startup and\nProduct\nShowcases",
    blurb:
      "Explore topics across software engineering, product design, data, cybersecurity, career growth, and more. Ask questions, gain practical insights, and leave with knowledge you can apply immediately.",
    bg: "#FF8FA3",
    ink: "#3A1220",
    tilt: -5.5,
    lift: 12,
  },
  {
    n: "04",
    title: "After Party\nCelebration",
    blurb:
      "Explore topics across software engineering, product design, data, cybersecurity, career growth, and more. Ask questions, gain practical insights, and leave with knowledge you can apply immediately.",
    bg: "#FFD84D",
    ink: "#3A2E05",
    tilt: 2.5,
    lift: 6,
  },
];
