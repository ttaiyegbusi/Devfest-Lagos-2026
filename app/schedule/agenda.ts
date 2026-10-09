import data from "../data.json";

/* Where the schedule comes from — the same arrangement as the speaker lineup,
 * for the same reason. By default the committed data.json at the app root
 * (the "schedule" key); set SCHEDULE_URL to read the schedule tab of a
 * published Google Sheet as CSV. See app/speakers/lineup.ts for the long
 * version.
 *
 * The sheet is one row per SPEAKER, not per session, because a spreadsheet has
 * no good way to hold a list inside a cell. Rows that share a day, a time and
 * a title are folded into one session with several speakers — so a session
 * with three people is three rows that repeat the first four columns.
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
export type Agenda = {
  days: Day[];
  /** False while the schedule is still being drawn up: the page says so
   *  instead of showing the sessions. */
  published: boolean;
};

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

/* A spreadsheet error, published.
 *
 * The schedule tab is generated from the run-of-show rather than typed, so it
 * can fail in a way the speakers tab cannot: in October 2026 its published CSV
 * came back as the header row and a single #NAME? for a few minutes while the
 * sheet recalculated. Zero usable rows is already caught below, but a feed can
 * also come back half-right — one broken formula in a column and every row
 * carries a #REF! where its title should be — and that is worse, because it
 * renders. A feed carrying a spreadsheet error is a feed mid-recalculation or
 * mid-breakage. Neither is worth putting on the page, so it is treated exactly
 * like a feed that could not be fetched: the committed schedule is served and
 * the reason is logged. The next revalidation, five minutes later, picks the
 * sheet up once it has recovered. */
const SHEET_ERRORS = new Set([
  "#NAME?",
  "#REF!",
  "#VALUE!",
  "#DIV/0!",
  "#NUM!",
  "#NULL!",
  "#N/A",
  "#ERROR!",
  "#GETTING_DATA",
]);

const isSheetError = (cell: string) => SHEET_ERRORS.has(cell.trim().toUpperCase());

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
  if (!lines.length) return { days: [], published: true };

  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());
  const days = new Map<string, Session[]>();
  const order: string[] = [];

  for (const row of lines.slice(1)) {
    const cells = splitRow(row);
    const broken = cells.find(isSheetError);
    if (broken) throw new Error(`the feed carries a spreadsheet error (${broken})`);

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

  return {
    days: order.map((label) => ({ label, sessions: days.get(label)! })),
    published: true,
  };
}

function fromJson(value: unknown): Agenda {
  const { days, published } = (value ?? {}) as {
    days?: unknown;
    published?: unknown;
  };
  // Only an explicit `false` holds the schedule back.
  const isPublished = published !== false;
  if (!Array.isArray(days)) return { days: [], published: isPublished };
  return {
    published: isPublished,
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

const COMMITTED = fromJson(data.schedule);

/* Google serves a published sheet from a cache, and the schedule tab currently
 * has more than one snapshot in it: ask three times in a row and you get the
 * full thirty-seven rows, then #NAME?, then #NAME? again. The tab is generated
 * rather than typed, and whatever generates it uses a function the publishing
 * renderer does not always resolve.
 *
 * One request therefore decides nothing. Asking again costs a few hundred
 * milliseconds once every five minutes and usually lands on a good snapshot,
 * which is the difference between the live schedule and yesterday's commit. */
const ATTEMPTS = 3;

/** The feed, or a throw describing every attempt that failed. */
async function fromFeed(source: string): Promise<Agenda> {
  const failures: string[] = [];

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    // Each attempt needs its own URL. Retrying the first one would be served
    // the same cached response — Next's cache and Google's both — and a retry
    // that cannot see a different answer is not a retry.
    const url = new URL(source);
    if (attempt) url.searchParams.set("attempt", String(attempt));

    try {
      const response = await fetch(url, {
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
      failures.push(`attempt ${attempt + 1}: ${(error as Error).message}`);
    }
  }

  throw new Error(failures.join("; "));
}

export async function getAgenda(): Promise<Agenda> {
  if (!SOURCE) return COMMITTED;

  try {
    return await fromFeed(SOURCE);
  } catch (error) {
    // Never a broken page over a schedule.
    console.error(
      `[schedule] could not read SCHEDULE_URL, serving the committed schedule:`,
      error,
    );
    return COMMITTED;
  }
}
