import { getAgenda, type Agenda } from "../schedule/agenda";
import { getLineup, type Lineup } from "../speakers/lineup";
import { getSponsors, type Sponsor } from "../sponsors/list";
import { SQUADS } from "../team/roster";
import teamFile from "../team/team.json";
import { staticEntries, type Entry } from "./entry";
import { spoken, toMinutes, type When } from "./when";

/* Everything the ask panel can answer.
 *
 * The site already knows all of this; it only ever said it on separate pages.
 * Nothing here is written for the panel — each entry is built from the data a
 * page is drawn from, so the panel cannot say something the page does not.
 *
 * The schedule, the lineup and the sponsors are read through getAgenda(),
 * getLineup() and getSponsors(), never from the committed files directly: with
 * SCHEDULE_URL / SPEAKERS_URL set those follow the spreadsheet, and data.json is only the snapshot they fall back
 * to. Reading the file would leave the panel a deploy behind the pages.
 *
 * Server only, because of those two fetches. The panel gets the result from
 * app/api/ask/knowledge/route.ts. */

const SCHEDULE = { label: "See the full schedule", href: "/schedule" };
const SPEAKERS = { label: "See all the speakers", href: "/speakers" };

/* "Day 2" and "the second day" for a tab the sheet calls "Day Two". */
const ORDINALS = [
  ["1", "first"],
  ["2", "second"],
  ["3", "third"],
];

const span = (time: string, until?: string) => (until ? `${time}–${until}` : time);

/* "1:00 PM" for the sheet's "13:00", or the sheet's own words if they are not
   a time. */
const clock = (time: string) => {
  const minutes = toMinutes(time);
  return minutes === null ? time : spoken(minutes);
};

const person = (p: { name: string; role: string; org: string }) => {
  const title = [p.role, p.org].filter(Boolean).join(", ");
  return title ? `${p.name} (${title})` : p.name;
};

/* A session's place on the clock. The sheet's times are display text, so one
   that cannot be read leaves the session findable by its words and not by the
   hour. With no end time it is taken to run half an hour. */
function slot(day: number, label: string, time: string, until?: string): { when?: When } {
  const from = toMinutes(time);
  if (from === null) return {};
  const end = until ? toMinutes(until) : null;
  return end !== null && end > from
    ? { when: { day, label, from, to: end } }
    : { when: { day, label, from, to: from + 30, guessed: true } };
}

/* What people call a session that its title does not: the sheet says "Party"
   and "Key Note 1", the corridor says "after party" and "keynote". */
function aliases(title: string): string[] {
  const t = title.toLowerCase();
  return [
    ...(/\bparty\b/.test(t) ? ["after", "afterparty"] : []),
    ...(/\bkey\s+note\b/.test(t) ? ["keynote"] : []),
  ];
}

/* A room relaying another room's session is a row in the sheet and not a
   second session: listing it would answer "what is on at ten?" twice. */
const isRelay = (title: string) => /^broadcast:/i.test(title);

function schedule(agenda: Agenda): Entry[] {
  if (!agenda.published || !agenda.days.length) {
    return [
      {
        q: "What is on the schedule?",
        a: "The schedule is still being drawn up. It will be on the schedule page as soon as it is confirmed.",
        tags: ["agenda", "programme", "program", "timetable", "sessions", "talks", "day"],
        links: [SCHEDULE],
      },
    ];
  }

  return agenda.days.flatMap((day, index) => {
    const sessions = day.sessions.filter((s) => !isRelay(s.title));
    if (!sessions.length) return [];
    const name = day.date ? `${day.label} (${day.date})` : day.label;

    return [
      {
        q: `What is on the schedule for ${day.label}?`,
        a: `${name} has ${sessions.length} sessions, starting at ${sessions[0].time}.`,
        lines: sessions.map(
          (s) => `${span(s.time, s.until)} · ${s.title}${s.track ? ` · ${s.track}` : ""}`,
        ),
        tags: ["agenda", "programme", "program", "timetable", "sessions", ...(ORDINALS[index] ?? [])],
        links: [SCHEDULE],
      },
      ...sessions.map((s) => ({
        q: s.title,
        a: [
          `${[s.format, `${day.label}, ${span(s.time, s.until)}`, s.track].filter(Boolean).join(" · ")}.`,
          s.speakers.length ? `With ${s.speakers.map(person).join(" and ")}.` : "",
          s.summary ?? "",
        ]
          .filter(Boolean)
          .join(" "),
        /* Only the format and the session's other names. The room and the
           speakers are in the answer, where they count for less: a search for
           a speaker should lead with the speaker, and "day 2" should not find
           every talk in Room 2. */
        tags: [...(s.format ? [s.format] : []), ...aliases(s.title)],
        links: [SCHEDULE],
        ...slot(index, day.label, s.time, s.until),
      })),
    ];
  });
}

function speakers(lineup: Lineup, agenda: Agenda): Entry[] {
  if (!lineup.announced || !lineup.days.length) {
    return [
      {
        q: "Who is speaking?",
        a: "The lineup has not been announced yet. Speakers go up on the speakers page as they are confirmed.",
        tags: ["speaker", "speakers", "lineup", "talk"],
        links: [SPEAKERS],
      },
    ];
  }

  /* Where each speaker is on the schedule, if the schedule says. */
  /* Said as "their session (talk)" so that "when is Chisom's session?" and
     "…'s workshop?" find the speaker: the sheet's titles use neither word. A
     speaker on twice gets both. */
  const slots = new Map<string, string[]>();
  if (agenda.published) {
    for (const day of agenda.days) {
      for (const s of day.sessions) {
        if (isRelay(s.title)) continue;
        const kind = s.format ? ` (${s.format.toLowerCase()})` : "";
        const said = `Their session${kind}: “${s.title}”, ${day.label}, ${span(clock(s.time), s.until && clock(s.until))}${s.track ? ` in ${s.track}` : ""}.`;
        for (const p of s.speakers) {
          const key = p.name.toLowerCase();
          slots.set(key, [...(slots.get(key) ?? []), said]);
        }
      }
    }
  }

  return lineup.days.flatMap((day, index) => [
    {
      q: `Who is speaking on ${day.label}?`,
      a: `${day.speakers.length} speakers on ${day.label}${day.date ? ` (${day.date})` : ""}.`,
      lines: day.speakers.map(person),
      tags: ["speaker", "speakers", "lineup", ...(ORDINALS[index] ?? [])],
      links: [SPEAKERS],
    },
    ...day.speakers.map((s) => ({
      q: s.name,
      a: [
        `${[s.role, s.org].filter(Boolean).join(", ") || "Speaker"}. Speaking on ${day.label}.`,
        ...(slots.get(s.name.toLowerCase()) ?? []),
      ]
        .filter(Boolean)
        .join(" "),
      tags: [s.org, s.role].filter(Boolean),
      links: [SPEAKERS],
    })),
  ]);
}

/* sponsors.json and team.json began as invented companies and invented
   people, and each says so in a _comment that starts with PLACEHOLDER. A page
   of placeholder logos is visibly a draft; the panel naming one in a sentence
   is a claim. So a file still carrying that word is not read here, and
   replacing it with the real list is what switches it on. Sponsors read from
   the sheet's sponsors tab are never a placeholder — getSponsors() says which
   it handed back. */
const isPlaceholder = (file: { _comment?: unknown }) =>
  [file._comment].flat().join(" ").includes("PLACEHOLDER");

function sponsors(list: Sponsor[], placeholder: boolean): Entry[] {
  const SPONSORS = list;
  if (placeholder || !SPONSORS.length) return [];
  return [
    {
      q: "Who is sponsoring DevFest Lagos 2026?",
      a: `DevFest Lagos 2026 is sponsored by ${SPONSORS.map((s) => s.name).join(", ")}.`,
      tags: ["sponsor", "sponsors", "sponsorship", "partner", "partners"],
    },
  ];
}

function team(): Entry[] {
  if (isPlaceholder(teamFile) || !SQUADS.length) return [];
  return [
    {
      q: "Who organises DevFest Lagos 2026?",
      a: "DevFest Lagos is put on by GDG Lagos's organising team.",
      lines: SQUADS.map((s) => `${s.name}: ${s.people.map((p) => p.name).join(", ")}`),
      tags: ["team", "organiser", "organisers", "organizer", "organizers", "organising", "behind", "gdg"],
      links: [{ label: "Meet the team", href: "/team" }],
    },
  ];
}

export async function getKnowledge(): Promise<Entry[]> {
  const [agenda, lineup, backers] = await Promise.all([
    getAgenda(),
    getLineup(),
    getSponsors(),
  ]);
  return [
    ...staticEntries(),
    ...schedule(agenda),
    ...speakers(lineup, agenda),
    ...sponsors(backers.sponsors, backers.placeholder),
    ...team(),
  ];
}
