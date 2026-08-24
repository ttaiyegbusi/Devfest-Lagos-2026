import { SPONSORS } from "./sponsors";
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
export function Sponsors() {
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
                  {s.logo ? (
                    <img className="sponsors__logo" src={s.logo} alt={s.name} />
                  ) : (
                    <span className="sponsors__wordmark">{s.name}</span>
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
