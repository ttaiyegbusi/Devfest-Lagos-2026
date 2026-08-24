import { HeroNav } from "./HeroNav";
import { RotatingWord } from "./RotatingWord";
import { HeroCta } from "./HeroCta";
import { HeroScene } from "./HeroScene";
import "./Hero.css";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__scene">
        <HeroScene />
      </div>

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

          <HeroCta />
        </div>
      </div>
    </section>
  );
}
