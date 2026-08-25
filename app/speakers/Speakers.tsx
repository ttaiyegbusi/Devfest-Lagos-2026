import type { Speaker } from "./lineup";

/* One day's speakers, as a grid.
 *
 * This was a carousel — a concave wall of cards you dragged through, one at a
 * time. It was the right shape for the seven-card placeholder lineup and the
 * wrong one for a real conference: at fifty speakers, finding a name means
 * dragging past forty of them, and nobody does that. A grid shows everyone at
 * once and costs the reader nothing but the scroll they were already doing.
 *
 * So the cards got smaller and there are many more of them. The photo carries
 * the card now, because at this size a face is what someone recognises before
 * they have read anything.
 *
 * No card is a link or a button. Nothing here has anywhere to go yet, and a
 * card that looks pressable and does nothing is worse than one that does not.
 */

/** Up to two initials, for a speaker whose photo has not arrived yet. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function Speakers({ speakers }: { speakers: Speaker[] }) {
  return (
    <>
      <p className="speakers__count" data-reveal data-rise>
        {speakers.length} {speakers.length === 1 ? "speaker" : "speakers"}
      </p>

      {/* Fade, no rise. A per-card stagger reads well for six cards and badly
          for fifty — the last one would arrive four seconds after the first —
          and fifty cards travelling together is a lot of movement for a section
          the reader has only just reached. */}
      <ul className="speakers__grid" data-reveal data-rise="still">
        {speakers.map((s) => (
          <li className="speaker" key={`${s.name}-${s.org}`}>
            <span className="speaker__photo">
              {s.image ? (
                <img src={s.image} alt="" loading="lazy" decoding="async" />
              ) : (
                <span
                  className="speaker__initials"
                  aria-hidden="true"
                  style={{
                    ["--from" as string]: s.tint[0],
                    ["--to" as string]: s.tint[1],
                  }}
                >
                  {initials(s.name)}
                </span>
              )}
            </span>
            <p className="speaker__name">{s.name}</p>
            {s.role && <p className="speaker__role">{s.role}</p>}
            {s.org && <p className="speaker__org">{s.org}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
