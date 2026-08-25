"use client";

import { useState } from "react";
import type { Day, Presenter, Session } from "./agenda";
import { DayTabs } from "../shell/DayTabs";
import { panelProps } from "../shell/tabs";
import { GalleryIcon, ListIcon, ViewToggle } from "../shell/ViewToggle";
import { useRememberedView } from "../shell/views";

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
 * remembered — see app/shell/ViewToggle.tsx.
 */

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
  const [view, setView] = useRememberedView("devfest:schedule-view", "list", "gallery");

  const day = days[active];

  return (
    <>
      <div className="leaf__bar">
        <DayTabs
          days={days}
          active={active}
          onSelect={setActive}
          idPrefix="schedule"
        />
        <ViewToggle
          label="How to show the schedule"
          view={view}
          onChange={setView}
          options={[
            { value: "list", label: "List", icon: ListIcon },
            { value: "gallery", label: "Gallery", icon: GalleryIcon },
          ]}
        />
      </div>

      <div {...panelProps("schedule", active, days.length)}>
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
