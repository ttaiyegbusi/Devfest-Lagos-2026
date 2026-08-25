"use client";

import { useRef, useState } from "react";
import type { Day } from "./lineup";
import { SpeakerGrid } from "./SpeakerGrid";
import { Speakers } from "./Speakers";

/* The lineup is split by day, so the day is a choice the reader makes and the
 * speakers are what that choice shows. That is a tab set, and it is built as
 * one properly: arrow keys move between tabs, only the selected tab is in the
 * tab order, and the panel is labelled by the tab that opened it.
 *
 * A single day gets no tabs at all. One tab is not a choice, and a control that
 * cannot change anything is worse than no control.
 *
 * The same tabs sit above two different things. On the landing page a day's
 * speakers are a draggable wall of cards — a taste of who is coming. On
 * /speakers they are a grid, because that page exists for finding a name among
 * fifty. `variant` is a plain string rather than the component itself, since
 * this is a client component and the server has no way to hand one across. */

export function SpeakerDays({
  days,
  variant = "wall",
}: {
  days: Day[];
  variant?: "wall" | "grid";
}) {
  const [active, setActive] = useState(0);
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
      {days.length > 1 && (
        <div className="speakers__days" role="tablist" aria-label="Choose a day">
          {days.map((entry, i) => (
            <button
              key={entry.label}
              type="button"
              role="tab"
              id={`speakers-tab-${i}`}
              className="speakers__day"
              aria-selected={i === active}
              aria-controls={`speakers-panel-${i}`}
              /* Roving: the tab set is one stop, and the arrows move within
                 it. Tabbing through five days to reach the lineup is not a
                 tab set, it is an obstacle. */
              tabIndex={i === active ? 0 : -1}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
            >
              <span className="speakers__day-label">{entry.label}</span>
              {entry.date && (
                <span className="speakers__day-date">{entry.date}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div
        role={days.length > 1 ? "tabpanel" : undefined}
        id={`speakers-panel-${active}`}
        aria-labelledby={days.length > 1 ? `speakers-tab-${active}` : undefined}
      >
        {/* Keyed by the day, so switching days builds a new wall rather than
            sliding the old one to a position that means nothing in the new
            lineup. */}
        {variant === "grid" ? (
          <SpeakerGrid key={day.label} speakers={day.speakers} />
        ) : (
          <Speakers key={day.label} speakers={day.speakers} />
        )}
      </div>
    </>
  );
}
