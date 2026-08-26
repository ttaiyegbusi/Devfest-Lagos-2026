/* The questions, and who they belong to.
 *
 * WHERE THIS COPY CAME FROM. The event facts — what DevFest is, that tickets
 * are neither refundable nor transferable, that registration is on the
 * ticketing site and you pick your day there, that sessions start at 9:00 AM
 * prompt, that speaking is by call for papers, and that there is a conduct
 * guideline everyone is held to — are DevFest Lagos's own, carried over from
 * the 2025 FAQ and re-worded for 2026. They are the organisers' policies, not
 * invented here, and should not be softened without checking with them.
 *
 * STILL TO CONFIRM FOR 2026, all marked TODO below:
 *   · the dates and the venue. 2025 ran 18–22 November at the National
 *     Theatre, Iganmu. This site says two days in November 2026 and names no
 *     venue, because neither has been confirmed to us. Do not copy 2025's.
 *   · the ticketing URL. 2025 used tickets.devfestlagos.com; the link here
 *     comes from app/links.ts so there is one place to change it.
 *   · whether the call for papers is open, and where it is announced.
 *
 * TWO OF THESE ANSWERS ARE THE SAME PROMISE AS app/pricing/tiers.ts, said a
 * second time: what a ticket covers, and how many days. If the tickets change,
 * these change with them or the site contradicts its own pricing — which is
 * exactly what happened when the two-day tickets landed against a FAQ that
 * still said "the full day".
 */
export type Faq = { q: string; a: string; group: string };

export const GROUPS = [
  "All",
  "About DevFest",
  "Ticketing and Access",
  "Claiming Tickets",
  "Upgrading Tickets",
  "At the Event",
] as const;

export const FAQS: Faq[] = [
  {
    group: "About DevFest",
    q: "What is Devfest",
    a: "DevFest is an annual developer conference run by Google Developer Groups around the world. DevFest Lagos is the Lagos edition, hosted by GDG Lagos, and it brings developers, designers, founders, students and industry speakers together to share what they have learned over the past year.",
  },
  {
    group: "About DevFest",
    /* TODO: dates and venue. Deliberately not stated — see the note above. */
    q: "When and where is DevFest Lagos 2026?",
    a: "DevFest Lagos 2026 runs over two days in November 2026, and each day starts at 9:00 AM prompt. The venue and the exact dates are announced ahead of tickets going on sale, so check back here or follow GDG Lagos for the announcement.",
  },
  {
    group: "About DevFest",
    q: "Who is DevFest Lagos for?",
    a: "Anyone building things, or wanting to. Engineers, designers, data and product people, founders and students all come, and the tracks are set up so that a beginner and someone ten years in can both find a room worth sitting in.",
  },
  {
    group: "About DevFest",
    q: "Is there a code of conduct?",
    a: "Yes. Everyone attending, speaking or exhibiting is expected to follow the community conduct guidelines. DevFest Lagos is meant to be a safe and inclusive event for everyone in the room, and the guidelines are there to keep it that way.",
  },
  {
    group: "Ticketing and Access",
    q: "How do I register for DevFest Lagos 2026?",
    a: "Registration is on the official ticketing site. You choose the day or days you want to attend based on what is on, pay there, and your confirmation and QR code are emailed to you as soon as payment clears.",
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
    group: "Claiming Tickets",
    q: "Are tickets refundable?",
    a: "No. Tickets for DevFest Lagos 2026 are non-refundable, so please be sure of the day you are picking before you pay.",
  },
  {
    group: "Claiming Tickets",
    q: "Can I transfer a ticket to someone else?",
    a: "No. Each ticket is tied to the person it was bought for and cannot be passed on to anybody else. If you are bringing people with you, buy each of them their own ticket in their own name.",
  },
  {
    group: "Claiming Tickets",
    q: "What if I register and can't attend anymore?",
    a: "Let us know as early as you can and we will release your place to someone waiting for one. Tickets are neither refundable nor transferable, so there is nothing to move to another name — but telling us early means the seat is not wasted.",
  },
  {
    group: "Claiming Tickets",
    q: "What information do I need to provide when buying tickets for others?",
    a: "Each attendee needs their own name and email address. The ticket is issued in that name and the QR code goes to that inbox, which is also why a ticket cannot be handed to somebody else later.",
  },
  {
    group: "Upgrading Tickets",
    q: "What does a ticket grant me access to?",
    a: "All talks and sessions, the sponsor booths, the networking area and the after party. The difference between the two tickets is how many days: Standard covers one day of the two, and Full Experience covers both.",
  },
  {
    group: "At the Event",
    q: "What time does each day start?",
    a: "Sessions begin at 9:00 AM prompt on both days, and doors open before that for registration. The full running order, room by room, is on the schedule page.",
  },
  {
    group: "At the Event",
    /* TODO: confirm whether the 2026 call for papers is open, and link it. */
    q: "Can I speak at DevFest Lagos 2026?",
    a: "Speaking is by call for papers. When it opens it is announced here and across GDG Lagos's channels, along with what to submit and by when; once it closes no further submissions are taken for that year.",
  },
];
