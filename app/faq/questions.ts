/* The questions, and who they belong to.
 *
 * WHERE THIS COPY CAME FROM. All eleven questions from DevFest Lagos's own FAQ
 * are here, in their order, with their answers re-worded for 2026. The facts
 * inside them are the organisers' and should not be softened without checking
 * with them: tickets are neither refundable nor transferable and each one is
 * tied to a named attendee; registration is on the ticketing site, where you
 * pick the day you want; sessions start at 9:00 AM prompt; speaking is by call
 * for papers; volunteers are wanted and are recruited through GDG Lagos's
 * channels; and the conduct guidelines are Google's community guidelines,
 * linked below rather than paraphrased.
 *
 * The rest — paying, what each ticket covers, buying for other people — are
 * this site's own, because this site sells the tickets and the 2025 one did
 * not. They must keep saying the same thing as app/pricing/tiers.ts: what a
 * ticket covers, and how many days. If the tickets change, these change with
 * them or the site contradicts its own pricing — which is exactly what
 * happened when the two-day tickets landed against a FAQ that still said "the
 * full day".
 *
 * THE DATES ARE CONFIRMED: 13 and 14 November 2026, at the National Theatre.
 * They fall on a Friday and a Saturday, which is what the day tabs on
 * /schedule and /speakers have been saying all along — so the site's two-day
 * shape is right, and 2025's five days do not carry over. Anything that names
 * a date names it from here.
 *
 * STILL TO CONFIRM, marked TODO below:
 *   · where volunteer applications go.
 *   · Facebook and YouTube, which is why the footer still leaves those two
 *     unlinked. X, Instagram and LinkedIn are in app/links.ts.
 */
import { SOCIALS } from "../links";

export type Faq = {
  q: string;
  a: string;
  group: string;
  /** Links under the answer, where the answer is not the whole story. */
  links?: { label: string; href: string }[];
};

export const GROUPS = [
  "All",
  "About DevFest",
  "Ticketing and Access",
  "Claiming Tickets",
  "Upgrading Tickets",
  "At the Event",
  "Getting Involved",
] as const;

export const FAQS: Faq[] = [
  {
    group: "About DevFest",
    q: "What is Devfest",
    a: "DevFest is an annual developer conference organised by Google Developer Groups (GDGs) across the world. The event brings together tech enthusiasts, developers and industry experts to share knowledge, experience and innovation.",
  },
  {
    group: "About DevFest",
    q: "What is DevFest Lagos 2026?",
    a: "DevFest Lagos 2026 is a two-day tech festival that puts tech enthusiasts — beginners, experts, and everyone in between — in one place.",
  },
  {
    group: "About DevFest",
    q: "When & where will DevFest Lagos 2026 take place?",
    a: "DevFest Lagos 2026 will be held on the 13th and 14th of November 2026 — a Friday and a Saturday — with each day's sessions kickstarting by 9:00 AM prompt at the National Theatre, Iganmu, Lagos.",
  },
  {
    group: "About DevFest",
    q: "What should I expect at DevFest Lagos 2026?",
    a: "DevFest Lagos 2026 is going to be bigger and better. The point goes beyond learning from industry experts, connecting with like-minded professionals and getting a look at the latest in technology — it is also an unforgettable experience, with plenty of fun, room to breathe, and memories to last a lifetime.",
  },
  {
    group: "About DevFest",
    q: "I'm a non-technical person, can I still attend DevFest Lagos 2026?",
    a: "Yes you can. There are sessions covering the writing, product design and product management side of tech as well as the engineering.",
  },
  {
    group: "Ticketing and Access",
    q: "How can I register for DevFest Lagos 2026?",
    a: "To attend DevFest Lagos 2026 you register through the official event registration platform. You can select the day you want to attend based on what each day has on it, and your confirmation and QR code are emailed to you as soon as payment clears.",
  },
  {
    group: "Ticketing and Access",
    q: "Can I buy tickets for the event through this platform?",
    a: "Yes. Tickets are sold here, and your confirmation and QR code are emailed to you as soon as payment clears.",
  },
  {
    group: "Ticketing and Access",
    q: "How do I pay for my ticket?",
    a: "Payments go through our payment partner and accept cards and bank transfer. Nothing is charged until you confirm.",
  },
  {
    group: "Ticketing and Access",
    q: "Is lunch or swag included in my ticket?",
    a: "Each ticket lists exactly what it covers — see “Pick your ticket” on the home page.",
  },
  {
    group: "Upgrading Tickets",
    q: "What does a ticket grant me access to?",
    a: "All talks and sessions, the sponsor booths, the networking area and the after party. The difference between the two tickets is how many days: Standard covers one day of the two, and Full Experience covers both.",
  },
  {
    group: "Claiming Tickets",
    q: "Are tickets refundable?",
    a: "No. Tickets for DevFest Lagos 2026 are non-refundable, so please be sure of the day you are picking before you pay.",
  },
  {
    group: "Claiming Tickets",
    q: "Can I transfer a ticket to someone else?",
    a: "No. Each ticket is tied to a specific attendee and cannot be transferred to another person. If you are bringing people with you, buy each of them their own ticket in their own name.",
  },
  {
    group: "Claiming Tickets",
    q: "What if I register and can't attend any more?",
    a: "Tickets are non-refundable for DevFest Lagos 2026 and not transferable — each one is tied to a specific attendee and cannot be passed to another person. Let us know as early as you can all the same, so your place can go to someone waiting for one.",
  },
  {
    group: "Claiming Tickets",
    q: "What information do I need to provide when buying tickets for others?",
    a: "Each attendee needs their own name and email address. The ticket is issued in that name and the QR code goes to that inbox, which is also why a ticket cannot be handed to somebody else later.",
  },
  {
    group: "At the Event",
    q: "Is there a code of conduct for attendees?",
    a: "Yes, there is a community conduct guideline that all attendees are expected to follow. We are committed to creating a safe and inclusive environment for all participants — please review the guidelines and stick to them, so the experience is a respectful and enjoyable one for everyone.",
    links: [
      {
        label: "Read the community guidelines",
        href: "https://developers.google.com/community-guidelines",
      },
    ],
  },
  {
    group: "At the Event",
    q: "What time does each day start?",
    a: "Each day's sessions kickstart by 9:00 AM prompt, and doors open before that for registration. The full running order, room by room, is on the schedule page.",
  },
  {
    group: "At the Event",
    q: "How can I get updates and announcements about DevFest Lagos 2026?",
    a: "Stay tuned by following our official social media channels and checking back here. You can also subscribe to our newsletter, at the bottom of this page, for the latest on speakers, sessions and event details.",
    links: [
      { label: "X", href: SOCIALS.X },
      { label: "Instagram", href: SOCIALS.Instagram },
      { label: "LinkedIn", href: SOCIALS.Linkedin },
    ],
  },
  {
    group: "Getting Involved",
    /* TODO: a direct destination for volunteer applications. Until there is
       one the answer sends people where the call is actually announced. */
    q: "Can I volunteer to help make DevFest Lagos 2026 a success?",
    a: "Yes — we welcome volunteers who are passionate about contributing to the success of DevFest Lagos 2026. To join the volunteer team, follow our social media channels for updates and information on how to get involved.",
    links: [
      { label: "X", href: SOCIALS.X },
      { label: "Instagram", href: SOCIALS.Instagram },
      { label: "LinkedIn", href: SOCIALS.Linkedin },
    ],
  },
  {
    group: "Getting Involved",
    q: "Can I still submit a proposal for a session or workshop (Call for Papers)?",
    a: "No you can't. The call for papers for DevFest Lagos 2026 is officially closed. Speakers are announced on the speakers page as they are confirmed.",
  },
];
