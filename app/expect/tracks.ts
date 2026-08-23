// What to expect — one full-bleed panel per track.
//
// Every panel shares a skeleton: a hairline down the middle, a heading block
// whose first line is the track number, a rule, and a narrow measure of copy.
// What changes is which side the copy sits on and what fills the other half —
// hence `side` and `media`.
//
// COPY: the numbering and titles are the design's. The prose is not — the
// reference sheet repeats one paragraph across 02, 03 and 04, and 01's list
// repeats a bullet and carries two typos, so it was never meant to ship. What
// is here now is written to fit each panel, but it still describes a programme
// that has not been confirmed: check it against the real schedule before
// launch, and note it deliberately makes no claim about ticket tiers.
//
// TOPIC PILLS: sixteen came from the design; eight more — Web Development,
// AR / VR, Open Source, Accessibility, Data Engineering, Developer Relations,
// Technical Writing, Game Development — were added to fill the cloud out, in
// the design's own colour language. They are a menu of subjects, not a
// schedule: cut any track that will not actually run.
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
      /** More than one cross-fades on a slow loop; one just sits there. */
      shots: Shot[];
      /** The artwork already carries the bowed edge and its colour sliver, so
          the CSS frame stays off rather than applying them a second time. */
      framed?: boolean;
    }
  /** The topic cloud. Panel 02. Rows are hand-set: the reference breaks
      them where it wants the rag, not where the box happens to run out. They
      are also only what reduced motion sees — with motion on, the pills are
      dropped into a heap and the rows never render.

      Two colour rules hold, and both are measured rather than judged by eye
      (the panel fill is #fcefcb):

        · label against its own pill ≥ 3:1, so the text reads;
        · pill against the panel ≥ 15 ΔE in CIELab, so the pill reads as a
          pill at all. "Motion Design" used to sit at 4.1 — a cream chip on a
          cream panel, invisible however good its text contrast was. Nothing
          else in the set is under 19. */
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
      "Engineers who shipped it, on stage",
      "Questions taken from the floor",
      "Speakers from Lagos and beyond",
      "Ideas you can use on Monday",
    ],
    close: "All of it on the main stage, from the first talk to the last.",
    side: "right",
    bg: "#ef4e22",
    ink: "#171717",
    fg: "#ffffff",
    line: "rgba(255, 255, 255, 0.5)",
    media: {
      kind: "photo",
      framed: true,
      // Four sessions, cross-fading in the one frame. The first is the print
      // the reference uses, so it is what the page rests on.
      shots: [
        {
          image: "/expect/panel-sessions-1.webp",
          alt: "A four-person panel seated on stage at DevFest Lagos, with the audience watching from the floor.",
          tint: ["#34a853", "#0e2a1c"],
        },
        {
          image: "/expect/panel-sessions-2.webp",
          alt: "Three panellists on stage in front of the sponsor banner, with the audience in the foreground.",
          tint: ["#4285f4", "#0d1f3f"],
        },
        {
          image: "/expect/panel-sessions-3.webp",
          alt: "A wide view of Panel Session 2 on the DevFest stage, seen from the back of a full auditorium.",
          tint: ["#8b5cf6", "#231449"],
        },
        {
          image: "/expect/panel-sessions-4.webp",
          alt: "Two speakers on stage for Panel Session 1, one of them holding a microphone.",
          tint: ["#f4511e", "#3a1210"],
        },
      ],
    },
  },
  {
    n: "02",
    title: "Different talks\nfrom different\nindustries.",
    body:
      "No two rooms are running the same thing. Pick a track and stay with it, or move between engineering, design, data and product all day.",
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
          { label: "Motion Design", bg: "#f7c26b", fg: "#171717" },
          { label: "Web Development", bg: "#4db6ac", fg: "#171717" },
        ],
        [
          { label: "SAAS", bg: "#cfe6fb", fg: "#171717" },
          { label: "Compliance", bg: "#cfc2f7", fg: "#4c1d95" },
        ],
        [
          { label: "Product Management", bg: "#2563eb", fg: "#ffffff" },
          { label: "Blockchain", bg: "#10b981", fg: "#171717" },
        ],
        [
          { label: "Mobile Development", bg: "#8b5cf6", fg: "#ffffff" },
          { label: "AR / VR", bg: "#3b1e9e", fg: "#ffffff" },
        ],
        [
          { label: "Machine Learning", bg: "#e6e0fb", fg: "#7c4dff" },
          { label: "Data Analysis", bg: "#f4511e", fg: "#ffffff" },
          { label: "Open Source", bg: "#0b7b74", fg: "#ffffff" },
        ],
        [
          { label: "AI", bg: "#6f6f6f", fg: "#ffffff" },
          { label: "Fintech", bg: "#111111", fg: "#ffffff" },
          { label: "Cloud & DevOps", bg: "#d4f5e4", fg: "#0b6b3a" },
        ],
        [
          { label: "Cybersecurity", bg: "#f0ae1e", fg: "#171717" },
          { label: "Product Design", bg: "#f0303f", fg: "#ffffff" },
          { label: "Accessibility", bg: "#1a73e8", fg: "#ffffff" },
        ],
        [
          { label: "Data Engineering", bg: "#0b6b3a", fg: "#ffffff" },
          { label: "Developer Relations", bg: "#00838f", fg: "#ffffff" },
        ],
        [
          { label: "Design Engineering", bg: "#e2e6fb", fg: "#2563eb" },
          { label: "Engineering", bg: "#fbe2e6", fg: "#f0303f" },
        ],
        [
          { label: "Technical Writing", bg: "#bcaaa4", fg: "#171717" },
          { label: "Game Development", bg: "#a142f4", fg: "#ffffff" },
        ],
      ],
    },
  },
  {
    n: "03",
    title: "Hands on\nWorkshops",
    body:
      "Bring a laptop and leave with working code. Small rooms, real problems, and someone beside you for the moment it stops compiling.",
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
          image: "/expect/workshops-4.webp",
          alt: "A speaker with one arm raised, smiling, in front of the DevFest stage graphics.",
          tint: ["#34a853", "#0e2a1c"],
        },
        {
          image: "/expect/workshops-3.webp",
          alt: "A speaker at a glass lectern with a laptop, wearing a headset microphone.",
          tint: ["#ea4335", "#3a1210"],
        },
        {
          image: "/expect/workshops-2.webp",
          alt: "A speaker in a blue kaftan addressing the room.",
          tint: ["#4285f4", "#0d1f3f"],
        },
        {
          image: "/expect/workshops-1.webp",
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
      "When the last talk ends, the room stays open. Music, food, and the conversations that only start once the badges come off.",
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
          image: "/expect/after-party-1.webp",
          alt: "Two guests dancing under the red lights of the after party.",
          tint: ["#f0303f", "#3a0d12"],
        },
        {
          image: "/expect/after-party-2.webp",
          alt: "Two guests outside the venue, posing for the camera.",
          tint: ["#ea4335", "#3a1210"],
        },
        {
          image: "/expect/after-party-3.webp",
          alt: "The host on the microphone in front of the DevFest After Party screen.",
          tint: ["#f4511e", "#3a1210"],
        },
        {
          image: "/expect/after-party-4.webp",
          alt: "A guest in a DevFest tee on the floor under purple light.",
          tint: ["#8b5cf6", "#231449"],
        },
        {
          image: "/expect/after-party-5.webp",
          alt: "A guest in a varsity jacket grinning, phone in hand.",
          tint: ["#7c4dff", "#1b0d3f"],
        },
        {
          image: "/expect/after-party-6.webp",
          alt: "A guest laughing under the green lights of the after party.",
          tint: ["#10b981", "#0e2a1c"],
        },
        {
          image: "/expect/after-party-7.webp",
          alt: "A guest in a yellow top and sunglasses, phone in hand.",
          tint: ["#f9ab00", "#3a2e05"],
        },
        {
          image: "/expect/after-party-8.webp",
          alt: "The crowd filming the stage with their phones up, under blue light.",
          tint: ["#2563eb", "#0b1f4d"],
        },
        {
          image: "/expect/after-party-9.webp",
          alt: "A guest in white cheering with both arms raised.",
          tint: ["#f0303f", "#3a0d12"],
        },
        {
          image: "/expect/after-party-10.webp",
          alt: "A guest in a pale kaftan applauding in the crowd.",
          tint: ["#8b5cf6", "#231449"],
        },
        {
          image: "/expect/after-party-11.webp",
          alt: "Two guests in DevFest lanyards under the green stage lights.",
          tint: ["#34a853", "#0e2a1c"],
        },
        {
          image: "/expect/after-party-12.webp",
          alt: "A guest in a striped shirt smiling, phone in hand.",
          tint: ["#a1887f", "#2b1c17"],
        },
      ],
    },
  },
];
