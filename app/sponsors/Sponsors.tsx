import { SPONSORS, type Sponsor } from "./list";
import "./Sponsors.css";

/* Sponsors, in one band that never ends.
 *
 * The same trick the after-party photographs use: a second copy of the run sits
 * directly after the first and the track travels exactly one run's width, so
 * the copy lands where the original started and the seam never shows. The copy
 * is decorative — only the first run is read out.
 *
 * How long a lap takes is worked out in the stylesheet from this count, so
 * adding a sponsor lengthens the lap rather than speeding the band up. */
function Mark({ sponsor }: { sponsor: Sponsor }) {
  return sponsor.logo ? (
    <img className="sponsors__logo" src={sponsor.logo} alt={sponsor.name} />
  ) : (
    <span className="sponsors__wordmark">{sponsor.name}</span>
  );
}

export function Sponsors() {
  if (!SPONSORS.length) return null;

  return (
    <section className="sponsors" aria-labelledby="sponsors-title">
      <div className="sponsors__intro" data-reveal>
        <h2 className="sponsors__title" id="sponsors-title" data-rise>
          Made possible by
        </h2>
      </div>

      <div className="sponsors__band">
        <div
          className="sponsors__track"
          style={{ ["--marks" as string]: SPONSORS.length }}
        >
          {[0, 1].map((copy) => (
            <ul className="sponsors__run" key={copy} aria-hidden={copy === 1 || undefined}>
              {SPONSORS.map((s) => (
                <li className="sponsors__item" key={s.name}>
                  {s.url ? (
                    /* The copy's links are out of the tab order as well as
                       hidden, so a keyboard reader meets each sponsor once. */
                    <a
                      className="sponsors__link"
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={copy === 1 ? -1 : undefined}
                    >
                      <Mark sponsor={s} />
                    </a>
                  ) : (
                    <Mark sponsor={s} />
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
