// What to expect — one full-bleed panel per track.
//
// Every panel shares a skeleton: a hairline down the middle, a heading block
// whose first line is the track number, a rule, and a narrow measure of copy.
// What changes is which side the copy sits on and what fills the other half —
// hence `side` and `media`.
//
// PLACEHOLDER COPY: the numbering, titles and topic pills come from the
// design; the prose does not. The reference repeats one paragraph across 02,
// 03 and 04, and 01's list repeats "Learn from industry giants" and carries
// two typos ("finanaicl", "cab"), so all of it is standing in until the
// programme is confirmed.
//
// PLACEHOLDER ART: drop files in public/expect/ and set `image` on a shot to
// use a real photograph; without one the frame falls back to a tinted block so
// no panel is ever blank while the shots are being chosen.

export type Shot = {
  /** e.g. "/expect/keynote.webp". */
  image?: string;
  /** Alt text for `image`; unused while the shot is a placeholder. */
  alt?: string;
  /** Placeholder tint, used only while `image` is unset. */
  tint: [string, string];
};

export type Pill = {
  label: string;
  bg: string;
  fg: string;
};

export type Media =
  /** One print, edges bowed. Panel 01. */
  | {
      kind: "photo";
      shot: Shot;
      /** The artwork already carries the bowed edge and its colour sliver, so
          the CSS frame stays off rather than applying them a second time. */
      framed?: boolean;
    }
  /** The topic cloud. Panel 02. Rows are hand-set: the reference breaks
      them where it wants the rag, not where the box happens to run out. */
  | { kind: "pills"; rows: Pill[][] }
  /** Two by two. Panel 03. */
  | { kind: "grid"; shots: Shot[] }
  /** A row along the bottom, bleeding off both edges. Panel 04. */
  | { kind: "strip"; shots: Shot[] };

export type Track = {
  /** Sits above the title, on the same leading, e.g. "01". */
  n: string;
  /** Newlines are the design's line breaks, not wrapping. */
  title: string;
  /** The paragraph under the rule. 01 sets a list instead. */
  body?: string;
  /** 01 only: the dashed list, and the line that closes it. */
  points?: string[];
  close?: string;
  /** Which half the copy sits in. The media takes the other. */
  side: "left" | "right";
  /** Panel fill. */
  bg: string;
  /** Number and title. */
  ink: string;
  /** Body copy, and anything else set on the fill. */
  fg: string;
  /** The rule and the hairline. */
  line: string;
  /** Fills the half the copy is not in. */
  media: Media;
};

export const TRACKS: Track[] = [
  {
    n: "01",
    title: "Panel Sessions and\nGlobal Keynotes",
    points: [
      "Learn from industry giants",
      "Build new relationships",
      "Get financial support",
      "Ask your questions live",
    ],
    close: "All in one place people can access instantly",
    side: "right",
    bg: "#ef4e22",
    ink: "#171717",
    fg: "#ffffff",
    line: "rgba(255, 255, 255, 0.5)",
    media: {
      kind: "photo",
      framed: true,
      shot: {
        image: "/expect/panel-sessions.jpg",
        alt: "A four-person panel seated on stage at DevFest Lagos, with the audience watching from the floor.",
        tint: ["#34a853", "#0e2a1c"],
      },
    },
  },
  {
    n: "02",
    title: "Different talks\nfrom different\nindustries.",
    body:
      "One track never fits a room this mixed. Sessions run across engineering, design, data and the business of building.",
    side: "left",
    bg: "#fcefcb",
    ink: "#f9ab00",
    fg: "#171717",
    line: "rgba(23, 23, 23, 0.25)",
    media: {
      kind: "pills",
      rows: [
        [
          { label: "Ui Design", bg: "#fbc9d4", fg: "#171717" },
          { label: "Motion Design", bg: "#fce8c0", fg: "#171717" },
        ],
        [
          { label: "SAAS", bg: "#cfe6fb", fg: "#171717" },
          { label: "Compliance", bg: "#cfc2f7", fg: "#7c4dff" },
        ],
        [
          { label: "Product Management", bg: "#2563eb", fg: "#ffffff" },
          { label: "Blockchain", bg: "#10b981", fg: "#ffffff" },
        ],
        [{ label: "Mobile Development", bg: "#8b5cf6", fg: "#ffffff" }],
        [
          { label: "Machine Learning", bg: "#e6e0fb", fg: "#7c4dff" },
          { label: "Data Analysis", bg: "#f4511e", fg: "#ffffff" },
        ],
        [
          { label: "AI", bg: "#6f6f6f", fg: "#ffffff" },
          { label: "Fintech", bg: "#111111", fg: "#ffffff" },
          { label: "Cloud & DevOps", bg: "#d4f5e4", fg: "#17a05a" },
        ],
        [
          { label: "Cybersecurity", bg: "#f0ae1e", fg: "#ffffff" },
          { label: "Product Design", bg: "#f0303f", fg: "#f4511e" },
        ],
        [
          { label: "Design Engineering", bg: "#e2e6fb", fg: "#2563eb" },
          { label: "Engineering", bg: "#fbe2e6", fg: "#f0303f" },
        ],
      ],
    },
  },
  {
    n: "03",
    title: "Hands on\nWorkshops",
    body:
      "One track never fits a room this mixed. Sessions run across engineering, design, data and the business of building.",
    side: "left",
    bg: "#000000",
    ink: "#f4511e",
    fg: "#ffffff",
    line: "rgba(255, 255, 255, 0.35)",
    media: {
      kind: "grid",
      // Laid out to match the reference: raised arm and lectern along the top,
      // the two floor shots beneath.
      shots: [
        {
          image: "/expect/workshops-4.jpg",
          alt: "A speaker with one arm raised, smiling, in front of the DevFest stage graphics.",
          tint: ["#34a853", "#0e2a1c"],
        },
        {
          image: "/expect/workshops-3.jpg",
          alt: "A speaker at a glass lectern with a laptop, wearing a headset microphone.",
          tint: ["#ea4335", "#3a1210"],
        },
        {
          image: "/expect/workshops-2.jpg",
          alt: "A speaker in a blue kaftan addressing the room.",
          tint: ["#4285f4", "#0d1f3f"],
        },
        {
          image: "/expect/workshops-1.jpg",
          alt: "A speaker in a denim jacket and patterned headwrap, arms open, presenting to the room.",
          tint: ["#8b5cf6", "#231449"],
        },
      ],
    },
  },
  {
    n: "04",
    title: "After Party\nCelebration",
    body:
      "One track never fits a room this mixed. Sessions run across engineering, design, data and the business of building.",
    side: "left",
    bg: "#f04e23",
    ink: "#171717",
    fg: "#ffffff",
    line: "rgba(255, 255, 255, 0.6)",
    media: {
      kind: "strip",
      // The band loops, so this is the run that repeats rather than a
      // fixed set of slots — add or drop photographs freely and the
      // travel speed stays the same.
      shots: [
        {
          image: "/expect/after-party-1.jpg",
          alt: "A guest in a striped shirt smiling, phone in hand.",
          tint: ["#a1887f", "#2b1c17"],
        },
        {
          image: "/expect/after-party-2.jpg",
          alt: "Two guests in DevFest lanyards under the green stage lights.",
          tint: ["#34a853", "#0e2a1c"],
        },
        {
          image: "/expect/after-party-3.jpg",
          alt: "A guest in a pale kaftan applauding in the crowd.",
          tint: ["#8b5cf6", "#231449"],
        },
        {
          image: "/expect/after-party-4.jpg",
          alt: "A guest in white cheering with both arms raised.",
          tint: ["#f0303f", "#3a0d12"],
        },
        {
          image: "/expect/after-party-5.jpg",
          alt: "The crowd filming the stage with their phones up, under blue light.",
          tint: ["#2563eb", "#0b1f4d"],
        },
        {
          image: "/expect/after-party-6.jpg",
          alt: "A guest in a yellow top and sunglasses, phone in hand.",
          tint: ["#f9ab00", "#3a2e05"],
        },
        {
          image: "/expect/after-party-7.jpg",
          alt: "A guest laughing under the green lights of the after party.",
          tint: ["#10b981", "#0e2a1c"],
        },
        {
          image: "/expect/after-party-8.jpg",
          alt: "A guest in a varsity jacket grinning, phone and snack in hand.",
          tint: ["#7c4dff", "#1b0d3f"],
        },
        {
          image: "/expect/after-party-9.jpg",
          alt: "A guest in a DevFest tee on the floor under purple light.",
          tint: ["#8b5cf6", "#231449"],
        },
        {
          image: "/expect/after-party-10.jpg",
          alt: "The host on the microphone in front of the DevFest After Party screen.",
          tint: ["#f4511e", "#3a1210"],
        },
        {
          image: "/expect/after-party-11.jpg",
          alt: "Two guests outside the venue, posing for the camera.",
          tint: ["#ea4335", "#3a1210"],
        },
        {
          image: "/expect/after-party-12.jpg",
          alt: "Three guests outside the venue with their arms around each other.",
          tint: ["#4285f4", "#0d1f3f"],
        },
        {
          image: "/expect/after-party-13.jpg",
          alt: "Two guests looking at something on a phone outside the venue.",
          tint: ["#a1887f", "#2b1c17"],
        },
        {
          image: "/expect/after-party-14.jpg",
          alt: "Two guests dancing under the red lights of the after party.",
          tint: ["#f0303f", "#3a0d12"],
        },      ],
    },
  },
];
