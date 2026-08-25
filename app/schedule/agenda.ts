import local from "./schedule.json";

/* Where the schedule comes from — the same arrangement as the speaker lineup,
 * for the same reason. By default the committed schedule.json next to this
 * file; set SCHEDULE_URL to read a JSON feed of the same shape or a Google
 * Sheet published as CSV instead. See app/speakers/lineup.ts for the long
 * version and .env.example for how to publish the sheet.
 *
 * The sheet is one row per SPEAKER, not per session, because a spreadsheet has
 * no good way to hold a list inside a cell. Rows that share a day, a time and
 * a title are folded into one session with several speakers — so a session
 * with three people is three rows that repeat the first four columns. Columns:
 *
 *   day, time, until, title, track, format, summary, name, role, org
 *
 * in any order and any capitalisation. A row with no speaker name is a session
 * with no speakers, which is what a lunch break is.
 */

const SOURCE = process.env.SCHEDULE_URL;
const REVALIDATE_SECONDS = 300;

export type Presenter = { name: string; role: string; org: string };

export type Session = {
  /** Display text, not a parsed time — "09:30", "9.30am", whatever the sheet says. */
  time: string;
  until?: string;
  title: string;
  track?: string;
  /** Keynote, Talk, Panel, Workshop, Break — printed as a tag. */
  format?: string;
  summary?: string;
  speakers: Presenter[];
};

export type Day = { label: string; date?: string; sessions: Session[] };
export type Agenda = { days: Day[] };

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

function toPresenter(row: Record<string, unknown>): Presenter | null {
  const name = text(row.name);
  if (!name) return null;
  return { name, role: text(row.role), org: text(row.org) };
}

function toSession(value: Record<string, unknown>): Session | null {
  const title = text(value.title);
  const time = text(value.time);
  // A session with no title is a blank row someone left behind; one with no
  // time cannot be placed on a schedule. Either way it is not a session.
  if (!title || !time) return null;

  const speakers = Array.isArray(value.speakers)
    ? value.speakers
        .map((s) => toPresenter(s as Record<string, unknown>))
        .filter((s): s is Presenter => s !== null)
    : [];

  const optional = (key: "until" | "track" | "format" | "summary") => {
    const found = text(value[key]);
    return found ? { [key]: found } : {};
  };

  return {
    time,
    title,
    ...optional("until"),
    ...optional("track"),
    ...optional("format"),
    ...optional("summary"),
    speakers,
  };
}

/** Splits one CSV line, honouring quoted fields and doubled quotes inside them. */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells;
}

function fromCsv(body: string): Agenda {
  // A quoted cell may contain newlines, so the file is walked character by
  // character rather than split on \n.
  const lines: string[] = [];
  let line = "";
  let quoted = false;
  for (const ch of body.replace(/\r\n/g, "\n")) {
    if (ch === '"') quoted = !quoted;
    if (ch === "\n" && !quoted) {
      lines.push(line);
      line = "";
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  if (!lines.length) return { days: [] };

  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());
  const days = new Map<string, Session[]>();
  const order: string[] = [];

  for (const row of lines.slice(1)) {
    const cells = splitRow(row);
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = cells[i] ?? "";
    });

    const session = toSession(record);
    if (!session) continue;

    const label = text(record.day) || "Day one";
    if (!days.has(label)) {
      days.set(label, []);
      order.push(label);
    }
    const sessions = days.get(label)!;

    // The fold: a row that repeats the time and the title of the session
    // before it is another speaker on that session, not a second session.
    const previous = sessions[sessions.length - 1];
    const target =
      previous && previous.time === session.time && previous.title === session.title
        ? previous
        : (sessions.push(session), session);

    const presenter = toPresenter(record);
    if (presenter) target.speakers.push(presenter);
  }

  return { days: order.map((label) => ({ label, sessions: days.get(label)! })) };
}

function fromJson(value: unknown): Agenda {
  const days = (value as { days?: unknown })?.days;
  if (!Array.isArray(days)) return { days: [] };
  return {
    days: days.flatMap((entry) => {
      const day = entry as { label?: unknown; date?: unknown; sessions?: unknown };
      const label = text(day.label);
      const sessions = Array.isArray(day.sessions)
        ? day.sessions
            .map((s) => toSession(s as Record<string, unknown>))
            .filter((s): s is Session => s !== null)
        : [];
      if (!label || !sessions.length) return [];
      const date = text(day.date);
      return [{ label, ...(date ? { date } : {}), sessions }];
    }),
  };
}

const COMMITTED = fromJson(local);

export async function getAgenda(): Promise<Agenda> {
  if (!SOURCE) return COMMITTED;

  try {
    const response = await fetch(SOURCE, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const body = await response.text();
    const trimmed = body.trimStart();
    const agenda =
      trimmed.startsWith("{") || trimmed.startsWith("[")
        ? fromJson(JSON.parse(body))
        : fromCsv(body);

    if (!agenda.days.length) throw new Error("no usable rows in the feed");
    return agenda;
  } catch (error) {
    // Never a broken page over a schedule.
    console.error(
      `[schedule] could not read SCHEDULE_URL, serving the committed schedule:`,
      error,
    );
    return COMMITTED;
  }
}
