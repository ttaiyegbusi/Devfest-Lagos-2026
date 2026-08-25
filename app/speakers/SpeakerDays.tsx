"use client";

import { useState } from "react";
import type { Day } from "./lineup";
import { DayTabs } from "../shell/DayTabs";
import { panelProps } from "../shell/tabs";
import { Speakers } from "./Speakers";

/* The wall on the landing page, day by day.
 *
 * The lineup is split by day, so the day is a choice the reader makes and the
 * speakers are what that choice shows — a tab set, built as one in
 * app/shell/DayTabs.tsx.
 *
 * The full lineup on /speakers has its own component: it carries a view
 * toggle as well, which the wall has no use for.
 */

export function SpeakerDays({ days }: { days: Day[] }) {
  const [active, setActive] = useState(0);
  const day = days[active];

  return (
    <>
      <DayTabs
        days={days}
        active={active}
        onSelect={setActive}
        idPrefix="speakers"
      />

      <div {...panelProps("speakers", active, days.length)}>
        {/* Keyed by the day, so switching days builds a new wall rather than
            sliding the old one to a position that means nothing in the new
            lineup. */}
        <Speakers key={day.label} speakers={day.speakers} />
      </div>
    </>
  );
}
