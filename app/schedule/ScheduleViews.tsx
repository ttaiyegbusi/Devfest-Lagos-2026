"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { Day, Presenter, Session } from "./agenda";
import "../shell/DayTabs.css";

/* The schedule, two ways.
 *
 * A schedule gets read for two different reasons and they want different
 * shapes. "When is the thing I came for?" is a question about a column of
 * times, and the list answers it — one line per session, times running down
 * the left, scannable without reading a word. "What is on today?" is a
 * question about the whole day, and the gallery answers that: every session
 * as a card, the summary visible without hunting.
 *
 * Neither is a fallback for the other, so the choice is the reader's and it is
 * remembered.
 */

type View = "list" | "gallery";

/* The chosen view is kept in localStorage, and localStorage is subscribed to
   rather than copied into state: a `storage` event carries a change made in
   another tab, and writes made here tell their own subscribers, since the
   browser does not raise that event for the tab that caused it.

   The server snapshot is "list" because the server cannot know what this
   reader chose. React hydrates against that and re-renders with the real
   value, so a remembered gallery arrives a beat after the list rather than
   never. */
const VIEW_KEY = "devfest:schedule-view";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "gallery" ? "gallery" : "list";
  } catch {
    return "list";
  }
}

function writeView(next: View) {
  try {
    localStorage.setItem(VIEW_KEY, next);
  } catch {
    /* not remembered, still switched */
  }
  for (const listener of listeners) listener();
}

/** Up to two initials, standing in for a photograph the schedule does not carry. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function Who({ speakers }: { speakers: Presenter[] }) {
  if (!speakers.length) return null;
  return (
    <ul className="who">
      {speakers.map((p) => (
        <li className="who__one" key={`${p.name}-${p.org}`}>
          <span className="who__badge" aria-hidden="true">
            {initials(p.name)}
          </span>
          <span className="who__text">
            <span className="who__name">{p.name}</span>
            {(p.role || p.org) && (
              <span className="who__at">
                {[p.role, p.org].filter(Boolean).join(", ")}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* A time and, if there is one, the time it runs until. Tabular figures so the
   column of times lines up digit under digit rather than drifting. */
function Clock({ session }: { session: Session }) {
  return (
    <p className="clock">
      <span className="clock__start">{session.time}</span>
      {session.until && <span className="clock__end">until {session.until}</span>}
    </p>
  );
}

function Tag({ format }: { format?: string }) {
  if (!format) return null;
  return (
    <span className="tag" data-format={format.toLowerCase()}>
      {format}
    </span>
  );
}

export function ScheduleViews({ days }: { days: Day[] }) {
  const [active, setActive] = useState(0);
  const view = useSyncExternalStore(subscribe, readView, () => "list" as View);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const next = (index + days.length) % days.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step) {
      event.preventDefault();
      select(active + step);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      select(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      select(days.length - 1);
    }
  };

  const day = days[active];

  return (
    <>
      <div className="schedule__bar">
        {days.length > 1 && (
          <div className="daytabs" role="tablist" aria-label="Choose a day">
            {days.map((entry, i) => (
              <button
                key={entry.label}
                type="button"
                role="tab"
                id={`schedule-tab-${i}`}
                className="daytab"
                aria-selected={i === active}
                aria-controls={`schedule-panel-${i}`}
                tabIndex={i === active ? 0 : -1}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                onClick={() => setActive(i)}
                onKeyDown={onKeyDown}
              >
                {entry.label}
                {entry.date && (
                  <span className="daytab__date"> ({entry.date})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Two buttons rather than a single toggle: "switch to gallery" and
            "switch to list" are two different things to ask for, and a lone
            button would have to be read to know which one it is offering. */}
        <div className="schedule__views" role="group" aria-label="How to show the schedule">
          <button
            type="button"
            className="schedule__view"
            aria-pressed={view === "list"}
            onClick={() => writeView("list")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
              <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            List
          </button>
          <button
            type="button"
            className="schedule__view"
            aria-pressed={view === "gallery"}
            onClick={() => writeView("gallery")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
              <path d="M1.5 1.5h4v4h-4zM8.5 1.5h4v4h-4zM1.5 8.5h4v4h-4zM8.5 8.5h4v4h-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            Gallery
          </button>
        </div>
      </div>

      <div
        role={days.length > 1 ? "tabpanel" : undefined}
        id={`schedule-panel-${active}`}
        aria-labelledby={days.length > 1 ? `schedule-tab-${active}` : undefined}
      >
        {view === "list" ? (
          <div className="agenda" data-reveal data-rise="still">
            {/* Column labels, and only that — every row states its own content
                in order, so this is drawn for the eye and skipped by a reader
                that would otherwise hear it once per screen. */}
            <div className="agenda__head" aria-hidden="true">
              <span>Time</span>
              <span>Session</span>
              <span>Who</span>
            </div>
            <ol className="agenda__list">
              {day.sessions.map((s) => (
                <li className="slot" key={`${s.time}-${s.title}`}>
                  <Clock session={s} />
                  <div className="slot__body">
                    <p className="slot__title">
                      {s.title}
                      <Tag format={s.format} />
                    </p>
                    {s.track && <p className="slot__track">{s.track}</p>}
                    {s.summary && <p className="slot__summary">{s.summary}</p>}
                  </div>
                  <div className="slot__who">
                    <Who speakers={s.speakers} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <ul className="cards" data-reveal data-rise="still">
            {day.sessions.map((s) => (
              <li className="ecard" key={`${s.time}-${s.title}`}>
                <div className="ecard__top">
                  <Clock session={s} />
                  <Tag format={s.format} />
                </div>
                <p className="ecard__title">{s.title}</p>
                {s.track && (
                  <p className="ecard__track">
                    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true" fill="none">
                      <path d="M6 13s4.5-4.2 4.5-7.4A4.5 4.5 0 0 0 1.5 5.6C1.5 8.8 6 13 6 13Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      <circle cx="6" cy="5.5" r="1.6" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    {s.track}
                  </p>
                )}
                {s.summary && <p className="ecard__summary">{s.summary}</p>}
                <div className="ecard__who">
                  <Who speakers={s.speakers} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
