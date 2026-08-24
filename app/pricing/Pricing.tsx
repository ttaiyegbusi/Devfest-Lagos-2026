import { naira, TIERS } from "./tiers";
import { Lanyards } from "./Lanyards";
import "./Pricing.css";

/* The ticket tiers, hung from lanyards like the badges you collect at the door.
 *
 * THE MARKUP IS THE STATIC SECTION. Everything here lays out and reads with no
 * JavaScript at all: three badges in a grid, every price and perk visible. The
 * physics is an enhancement layered over this by Lanyards, which takes the same
 * badges over and hangs them — so a reader with scripting off, or one who has
 * asked for less motion, loses the swing and nothing else.
 *
 * The badges are rendered here rather than inside the client component so the
 * prices are in the HTML the server sends. A price that only appears after
 * hydration is a price search engines never see and a slow phone shows late. */
export function Pricing() {
  return (
    <section className="tickets" id="pricing" aria-labelledby="tickets-title">
      <div className="tickets__intro" data-reveal>
        <h2 className="tickets__title" id="tickets-title" data-rise>
          Pick your badge
        </h2>
        <p className="tickets__lede" data-rise>
          Every ticket covers the whole day — the talks, the showcase floor and
          the after party. The tiers differ in what they add on top.
        </p>
      </div>

      <Lanyards>
        {TIERS.map((tier) => (
          <article
            className="badge"
            key={tier.name}
            data-featured={tier.featured || undefined}
            style={{ ["--cord" as string]: tier.cord, ["--ink" as string]: tier.ink }}
          >
            {/* The only part of a badge a finger may pull from — see the
                pointer handling in Lanyards. */}
            <div className="badge__grip" aria-hidden="true">
              <span className="badge__punch" />
            </div>

            <header className="badge__head">
              <h3 className="badge__name">{tier.name}</h3>
              <p className="badge__note">{tier.note}</p>
            </header>

            <p className="badge__price">
              {naira(tier.price)}
              {tier.qualifier ? (
                <span className="badge__qualifier">{tier.qualifier}</span>
              ) : null}
            </p>

            <ul className="badge__includes">
              {tier.includes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </Lanyards>

      <p className="tickets__foot">
        Prices are in naira and include VAT. Buying for a team?{" "}
        <a href="#faq">The FAQ covers group tickets.</a>
      </p>
    </section>
  );
}
