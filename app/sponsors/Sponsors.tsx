import { SPONSOR_TIERS } from "./sponsors";
import "./Sponsors.css";

/* Sponsors, in tiers, above the footer.
 *
 * A sponsor with no logo file yet is set as type rather than left as a broken
 * image or an empty box — the section lays out and reads before any artwork
 * exists, and a name in the right typeface is a perfectly respectable credit.
 * The logo replaces it the moment a file is dropped in public/sponsors/. */
export function Sponsors() {
  return (
    <section className="sponsors" aria-labelledby="sponsors-title">
      <div className="sponsors__intro" data-reveal>
        <h2 className="sponsors__title" id="sponsors-title" data-rise>
          Made possible by
        </h2>
      </div>

      {SPONSOR_TIERS.map((tier) => (
        <div className="sponsors__tier" key={tier.heading} data-scale={tier.scale} data-reveal>
          <h3 className="sponsors__heading" data-rise>
            {tier.heading}
          </h3>
          <ul className="sponsors__row" data-rise>
            {tier.sponsors.map((s) => (
              <li className="sponsors__item" key={s.name}>
                {s.href ? (
                  <a className="sponsors__link" href={s.href}>
                    <Mark {...s} />
                  </a>
                ) : (
                  <Mark {...s} />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Mark({ name, logo }: { name: string; logo?: string }) {
  if (logo) return <img className="sponsors__logo" src={logo} alt={name} />;
  return <span className="sponsors__wordmark">{name}</span>;
}
