import { HeroNav } from "./HeroNav";
import { RotatingWord } from "./RotatingWord";
import { HeroCta } from "./HeroCta";
import { HeroScene } from "./HeroScene";
import { Rain } from "./Rain";
import "./Hero.css";

export function Hero() {
  return (
    <section className="hero" data-sentinel="hero">
      <div className="hero__scene">
        <HeroScene />
      </div>

      {/* Night falls over the artwork, not instead of it. The illustration is
          drawn in daylight and cannot be recoloured piece by piece — it is one
          exported scene — so dark mode washes it instead: a deep blue laid
          over the whole frame, above the scene and below the copy, fading in
          rather than switching on. Transparent in light mode, and always
          present so there is an opacity to animate. */}
      <div className="hero__veil" aria-hidden="true" />

      {/* Rain, and only at night. It sits above the veil and below the copy, so
          the weather is in the scene rather than over the reader. Decorative:
          it says nothing the text does not. */}
      <Rain />

      <div className="hero__shell">
        <HeroNav />

        <div className="hero__copy" data-reveal>
          <h1 className="hero__title" data-rise>
            {/* The comma belongs to the word, not to the line. The rotator is an
                inline-block, which offers the line a break opportunity right
                before the comma — so on a narrow phone the comma dropped to a
                line of its own. Wrapping the pair keeps them together and lets
                the whole "<word>," wrap as one instead. */}
            One{" "}
            <span className="hero__phrase">
              <RotatingWord />,
            </span>
            <br />
            Endless Opportunities.
          </h1>

          <p className="hero__lede" data-rise>
            Join the largest annual tech conference in Africa, hosted by{" "}
            <br className="hero__break" />
            Google Developer Group Lagos (GDG Lagos).
          </p>

          {/* The venue, on its own line rather than folded into the lede above.
              Where it is happening is a different kind of fact from what it is
              — it gets looked for, not read — so it is set smaller and apart,
              where the eye can find it without reading the sentence again.
              The pin repeats the one the schedule cards use for a track, so a
              place is drawn the same way wherever the site states one. */}
          <p className="hero__where" data-rise>
            <svg width="13" height="15" viewBox="0 0 12 14" aria-hidden="true" fill="none">
              <path
                d="M6 13s4.5-4.2 4.5-7.4A4.5 4.5 0 0 0 1.5 5.6C1.5 8.8 6 13 6 13Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle cx="6" cy="5.5" r="1.6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Landmark Event Centre, Victoria Island.
          </p>

          <HeroCta />
        </div>
      </div>
    </section>
  );
}
