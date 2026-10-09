import type { Speaker } from "./lineup";
import { SpeakerPhoto } from "./SpeakerPhoto";

/* One day's speakers, two ways — both on the cream page, not the dark section.
 *
 * The grid is for finding someone. At fifty speakers that means seeing fifty,
 * so the tiles are small and there are many: six across at the reference
 * width, and the photo carries the tile because at that size a face is what
 * someone recognises before they have read anything.
 *
 * The gallery is for looking rather than finding. Four to a row, and each card
 * is drawn the way the wall on the landing page draws one — the photograph as
 * the artwork, the person as the caption under it — so the two pages read as
 * the same site rather than two takes on the same list.
 *
 * No card is a link or a button in either view. Nothing here has anywhere to
 * go yet, and a card that looks pressable and does nothing is worse than one
 * that does not.
 */

export function SpeakerGrid({ speakers }: { speakers: Speaker[] }) {
  return (
    /* Fade, no rise. A per-card stagger reads well for six cards and badly for
       fifty — the last one would arrive four seconds after the first — and
       fifty cards travelling together is a lot of movement for a page the
       reader has only just reached. */
    <ul className="speakers__grid" data-reveal data-rise="still">
      {speakers.map((s, i) => (
        <li className="speaker" key={`${i}-${s.name}-${s.org}`}>
          <span className="speaker__photo">
            <SpeakerPhoto speaker={s} placeholder="speaker__initials" />
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
      {speakers.map((s, i) => (
        <li className="pcard" key={`${i}-${s.name}-${s.org}`}>
          <span className="pcard__view">
            <SpeakerPhoto
              speaker={s}
              art="pcard__art"
              placeholder="pcard__art pcard__art--placeholder"
              mark="pcard__initials"
            />
          </span>
          <span className="pcard__caption">
            <span className="pcard__name">{s.name}</span>
            {s.role && <span className="pcard__role">{s.role}</span>}
            {s.org && <span className="pcard__at">{s.org}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
