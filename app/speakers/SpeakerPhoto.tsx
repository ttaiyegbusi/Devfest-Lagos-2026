"use client";

import { useState } from "react";
import type { Speaker } from "./lineup";

/* A speaker's photo, or their initials when there isn't one.
 *
 * The cards used to set the organisation large across the artwork, which read
 * well while every card was a placeholder and badly once real photographs
 * arrived: "Ramp by Quidax" printed across someone's face. So the artwork is
 * now the photograph alone, and the lettering only appears when there is no
 * photograph to cover.
 *
 * "No photograph" includes one that was supposed to load and didn't — a
 * mistyped URL, a deleted upload, an image host having a bad morning. A
 * broken-image icon is the one outcome worth ruling out, so a failed load
 * falls back to the same initials a missing URL gets.
 *
 * The three views draw this differently: the grid's placeholder is a single
 * tinted tile with the letters in it, while the wall and the gallery need the
 * letters as their own layer over a full-bleed one. Hence `mark` — pass a
 * class for the lettering and it becomes a second element, leave it out and
 * the letters sit inside the placeholder.
 */

/** Up to two initials, for a speaker with no photograph. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function SpeakerPhoto({
  speaker,
  art,
  placeholder,
  mark,
}: {
  speaker: Speaker;
  /** Class for the <img>. */
  art?: string;
  /** Class for the tinted block shown when there is no photograph. */
  placeholder: string;
  /** Class for the initials as a separate layer. Omit to nest them instead. */
  mark?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (speaker.image && !failed) {
    return (
      <img
        {...(art ? { className: art } : {})}
        src={speaker.image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  const tint = {
    ["--from"]: speaker.tint[0],
    ["--to"]: speaker.tint[1],
  } as React.CSSProperties;
  const letters = initials(speaker.name);

  // The name is already written under every card, so the letters are a
  // decorative stand-in for a face rather than anything to read out.
  if (!mark) {
    return (
      <span className={placeholder} style={tint} aria-hidden="true">
        {letters}
      </span>
    );
  }

  return (
    <>
      <span className={placeholder} style={tint} aria-hidden="true" />
      <span className={mark} aria-hidden="true">
        {letters}
      </span>
    </>
  );
}
