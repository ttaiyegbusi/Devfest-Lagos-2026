"use client";

import { useState } from "react";
import type { Day } from "./lineup";
import { DayTabs } from "../shell/DayTabs";
import { panelProps } from "../shell/tabs";
import { GalleryIcon, GridIcon, ViewToggle } from "../shell/ViewToggle";
import { useRememberedView } from "../shell/views";
import { SpeakerGallery, SpeakerGrid } from "./SpeakerGrid";

/* The full lineup, two ways.
 *
 * Someone on this page is doing one of two things, and they want opposite
 * layouts. Looking for a name means seeing as many people at once as will fit,
 * which is the grid: small tiles, six across, the whole day usually on one
 * screen. Browsing who is coming means looking properly at each one, which is
 * the gallery: a handful to a row, the organisation set large across the
 * artwork the way the wall on the landing page draws it.
 *
 * The grid is first because the page is called "the full lineup" and finding a
 * name is the commoner errand — but the choice is the reader's, and it is
 * remembered.
 */

export function SpeakerViews({ days }: { days: Day[] }) {
  const [active, setActive] = useState(0);
  const [view, setView] = useRememberedView(
    "devfest:lineup-view",
    "grid",
    "gallery",
  );

  const day = days[active];

  return (
    <>
      <div className="leaf__bar">
        <DayTabs
          days={days}
          active={active}
          onSelect={setActive}
          idPrefix="lineup"
        />
        <ViewToggle
          label="How to show the lineup"
          view={view}
          onChange={setView}
          options={[
            { value: "grid", label: "Grid", icon: GridIcon },
            { value: "gallery", label: "Gallery", icon: GalleryIcon },
          ]}
        />
      </div>

      <div {...panelProps("lineup", active, days.length)}>
        {view === "grid" ? (
          <SpeakerGrid key={`grid-${day.label}`} speakers={day.speakers} />
        ) : (
          <SpeakerGallery key={`gallery-${day.label}`} speakers={day.speakers} />
        )}
      </div>
    </>
  );
}
