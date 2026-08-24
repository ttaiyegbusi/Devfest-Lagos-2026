import { TICKETS } from "../links";
import { naira, TIERS } from "./tiers";
import { Lanyards } from "./Lanyards";
import "./Pricing.css";

/* The tickets, hung from lanyards like the badges you collect at the door.
 *
 * THE MARKUP IS THE SECTION. Everything here lays out and reads with no
 * JavaScript at all: both tickets in a grid, every price and perk visible. The
 * physics is an enhancement layered over it by Lanyards, which takes the same
 * cards over and hangs them — so a reader with scripting off, or one who has
 * asked for less motion, loses the swing and nothing else.
 *
 * Rendered on the server rather than inside the client component so the prices
 * are in the HTML that is sent. A price that only appears after hydration is a
 * price search engines never see and a slow phone shows late. */
export function Pricing() {
  return (
    <section className="tickets" id="pricing" aria-labelledby="tickets-title">
      <div className="tickets__intro" data-reveal>
        <h2 className="tickets__title" id="tickets-title" data-rise>
          Pick your ticket
        </h2>
        <p className="tickets__lede" data-rise>
          Two ways in. Both cover every talk, the sponsor booths and the
          networking floor — the difference is how many days you get.
        </p>
      </div>

      <Lanyards>
        {TIERS.map((tier) => (
          <article
            className="badge"
            key={tier.name}
            style={{
              ["--paper" as string]: tier.paper,
              ["--accent" as string]: tier.accent,
            }}
          >
            {/* The only part of a card a finger may pull from — see the pointer
                handling in Lanyards. */}
            <div className="badge__grip" aria-hidden="true">
              <span className="badge__punch" />
            </div>

            <header className="badge__head">
              <p className="badge__label">{tier.label}</p>
              <div className="badge__line">
                <h3 className="badge__name">{tier.name}</h3>
                <p className="badge__price">
                  {naira(tier.price)}
                  <span className="badge__per">{tier.per}</span>
                </p>
              </div>
            </header>

            <p className="badge__blurb">{tier.blurb}</p>

            <ul className="badge__includes">
              {tier.includes.map((line) => (
                <li key={line}>
                  <span className="badge__tick" aria-hidden="true">
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            <a className="badge__cta" href={TICKETS}>
              Secure ticket
              <span className="visually-hidden"> — {tier.name}</span>
            </a>
          </article>
        ))}
      </Lanyards>
    </section>
  );
}
