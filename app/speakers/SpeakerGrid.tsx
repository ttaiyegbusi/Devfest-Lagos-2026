import type { Speaker } from "./lineup";

/* One day's speakers, as a grid.
 *
 * The landing page shows the lineup as a carousel — a concave wall of cards
 * you drag through, which is the right shape for a taste of who is coming. It
 * is the wrong shape for finding someone: at fifty speakers that means
 * dragging past forty of them, and nobody does that. So the full lineup lives
 * on its own page, as a grid, where everyone is visible at once and it costs
 * the reader nothing but the scroll they were already doing.
 *
 * The cards are small and there are many. The photo carries the card, because
 * at this size a face is what someone recognises before they have read
 * anything.
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

export function SpeakerGrid({ speakers }: { speakers: Speaker[] }) {
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
