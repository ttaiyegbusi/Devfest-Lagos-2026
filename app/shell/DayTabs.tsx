"use client";

import { useRef } from "react";
import type { TabbedDay } from "./tabs";
import "./DayTabs.css";

/* A tab per day, built as a tab set properly: arrow keys move between tabs,
 * only the selected one is in the tab order, and the panel is labelled by the
 * tab that opened it.
 *
 * Three places need this — the wall on the landing page, the lineup and the
 * schedule — and each of them used to carry its own copy of the roving-focus
 * code. They are one component now, so a fix to the keyboard handling is a fix
 * everywhere rather than in whichever copy was noticed.
 *
 * The parent owns which day is selected. It is the parent that has to render
 * the matching panel, so the state belongs there and not in here.
 *
 * A single day gets no tabs at all: one tab is not a choice, and a control
 * that cannot change anything is worse than no control.
 */

export function DayTabs({
  days,
  active,
  onSelect,
  idPrefix,
  label = "Choose a day",
}: {
  days: TabbedDay[];
  active: number;
  onSelect: (index: number) => void;
  /** Namespaces the tab and panel ids, so two tab sets can share a page. */
  idPrefix: string;
  label?: string;
}) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  if (days.length < 2) return null;

  /* Wraps, and moves focus with the selection: an arrow key that changed the
     panel but left focus behind would leave the next arrow key pressing the
     old tab. */
  const step = (index: number) => {
    const next = (index + days.length) % days.length;
    onSelect(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta) {
      event.preventDefault();
      step(active + delta);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      step(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      step(days.length - 1);
    }
  };

  return (
    <div className="daytabs" role="tablist" aria-label={label}>
      {days.map((entry, i) => (
        <button
          key={entry.label}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${i}`}
          className="daytab"
          aria-selected={i === active}
          aria-controls={`${idPrefix}-panel-${i}`}
          /* Roving: the tab set is one stop and the arrows move within it.
             Tabbing through five days to reach the content is not a tab set,
             it is an obstacle. */
          tabIndex={i === active ? 0 : -1}
          ref={(el) => {
            tabs.current[i] = el;
          }}
          onClick={() => onSelect(i)}
          onKeyDown={onKeyDown}
        >
          {entry.label}
          {entry.date && <span className="daytab__date"> ({entry.date})</span>}
        </button>
      ))}
    </div>
  );
}

