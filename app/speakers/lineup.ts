// PLACEHOLDER LINEUP — swap for the confirmed speakers before launch.
//
// Each card shows the organisation over its artwork, the way the reference
// does, with the speaker and their role set underneath it. Drop a file in
// public/speakers/ and set `image` to use a real photo or key art; without one
// the card falls back to a tinted placeholder so the section is never blank
// while the lineup is being finalised.
//
// Name and role are each set on one line and ellipsised past it. There is room
// for roughly 35 characters on a wide screen and 22 on a phone, so a long name
// will be cut there rather than on a desktop — worth checking a real lineup at
// 390px before launch.
export type Speaker = {
  /** Set large across the card's artwork. */
  org: string;
  /** The caption under the artwork, and the card's accessible name. */
  speaker: string;
  role: string;
  /** e.g. "/speakers/ada.webp". */
  image?: string;
  /** Placeholder artwork tint, used only while `image` is unset. */
  tint: [string, string];
};

export const SPEAKERS: Speaker[] = [
  { org: "Google",      speaker: "Speaker one",   role: "Developer Relations",     tint: ["#4285F4", "#1B3A73"] },
  { org: "Paystack",    speaker: "Speaker two",   role: "Staff Engineer",          tint: ["#00C3F7", "#04435C"] },
  { org: "Moniepoint",  speaker: "Speaker three", role: "Head of Platform",        tint: ["#0357EE", "#04204F"] },
  { org: "Flutterwave", speaker: "Speaker four",  role: "Principal Engineer",      tint: ["#F9AB00", "#5C3E00"] },
  { org: "Andela",      speaker: "Speaker five",  role: "Engineering Manager",     tint: ["#34A853", "#123D1F"] },
  { org: "Microsoft",   speaker: "Speaker six",   role: "Cloud Advocate",          tint: ["#EA4335", "#5A1710"] },
  { org: "GDG Lagos",   speaker: "Speaker seven", role: "Community Lead",          tint: ["#8B5CF6", "#2E1B52"] },
];
