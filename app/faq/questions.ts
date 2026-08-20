// Placeholder answers — replace with the real copy before launch. The questions
// themselves come from the design.
export type Faq = { q: string; a: string; group: string };

export const GROUPS = [
  "All",
  "Ticketing and Access",
  "Claiming Tickets",
  "Upgrading Tickets",
] as const;

export const FAQS: Faq[] = [
  {
    group: "Ticketing and Access",
    q: "What is Devfest",
    a: "DevFest Lagos is the largest annual tech conference in Africa, hosted by Google Developer Group Lagos. It brings together engineers, designers, founders and students for a day of talks, workshops and showcases.",
  },
  {
    group: "Ticketing and Access",
    q: "Can I buy tickets for the event through this platform?",
    a: "Yes. Tickets are sold here, and your confirmation and QR code are emailed to you as soon as payment clears.",
  },
  {
    group: "Ticketing and Access",
    q: "Is lunch or swag included in my ticket?",
    a: "What is included depends on the ticket tier you choose. The tier breakdown is listed in full on the pricing page.",
  },
  {
    group: "Claiming Tickets",
    q: "What if I register and can't attend anymore?",
    a: "Let us know before the event and we will release your place. Tickets can also be transferred to someone else from your confirmation email.",
  },
  {
    group: "Ticketing and Access",
    q: "How do I pay for my ticket?",
    a: "Payments go through our payment partner and accept cards and bank transfer. Nothing is charged until you confirm.",
  },
  {
    group: "Claiming Tickets",
    q: "What information do I need to provide when buying tickets for others?",
    a: "Each attendee needs their own name and email address so their ticket and QR code reach them directly.",
  },
  {
    group: "Upgrading Tickets",
    q: "What does a ticket grant me access to?",
    a: "Entry to the venue for the full day, all keynote and panel sessions, the product showcase floor, and the after party.",
  },
];
