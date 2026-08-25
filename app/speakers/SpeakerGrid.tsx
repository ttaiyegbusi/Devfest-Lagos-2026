import type { Speaker } from "./lineup";

/* One day's speakers, two ways — both on the cream page, not the dark section.
 *
 * The grid is for finding someone. At fifty speakers that means seeing fifty,
 * so the tiles are small and there are many: six across at the reference
 * width, and the photo carries the tile because at that size a face is what
 * someone recognises before they have read anything.
 *
 * The gallery is for looking rather than finding. Four to a row, and each card
 * is drawn the way the wall on the landing page draws one — the organisation
 * set large across the artwork, the person as the caption under it — so the
 * two pages read as the same site rather than two takes on the same list.
 *
 * No card is a link or a button in either view. Nothing here has anywhere to
 * go yet, and a card that looks pressable and does nothing is worse than one
 * that does not.
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

/** The tint a placeholder is painted with, as custom properties. */
const tint = (s: Speaker) =>
  ({ ["--from"]: s.tint[0], ["--to"]: s.tint[1] }) as React.CSSProperties;

export function SpeakerGrid({ speakers }: { speakers: Speaker[] }) {
  return (
    /* Fade, no rise. A per-card stagger reads well for six cards and badly for
       fifty — the last one would arrive four seconds after the first — and
       fifty cards travelling together is a lot of movement for a page the
       reader has only just reached. */
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
                style={tint(s)}
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
  );
}

export function SpeakerGallery({ speakers }: { speakers: Speaker[] }) {
  return (
    <ul className="lineup" data-reveal data-rise="still">
      {speakers.map((s) => (
        <li className="pcard" key={`${s.name}-${s.org}`}>
          <span className="pcard__view">
            {s.image ? (
              <img className="pcard__art" src={s.image} alt="" loading="lazy" />
            ) : (
              <span
                className="pcard__art pcard__art--placeholder"
                style={tint(s)}
              />
            )}
            {/* The organisation is the artwork, the person is the caption —
                the same order the wall uses. */}
            {s.org && (
              <span className="pcard__org" aria-hidden="true">
                {s.org}
              </span>
            )}
          </span>
          <span className="pcard__caption">
            <span className="pcard__name">{s.name}</span>
            {s.role && <span className="pcard__role">{s.role}</span>}
            {/* Printed again under the name, because the wordmark above is
                artwork and is hidden from a screen reader. */}
            {s.org && <span className="pcard__at">{s.org}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
