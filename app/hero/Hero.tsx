import { HeroNav } from "./HeroNav";
import { RotatingWord } from "./RotatingWord";
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

        <div className="hero__copy">
          <h1 className="hero__title">
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

          <p className="hero__lede">
            Join the largest annual tech conference in Africa, hosted by{" "}
            <br className="hero__break" />
            Google Developer Group Lagos (GDG Lagos).
          </p>

          <form className="hero__ask" action="#" role="search">
            <label className="visually-hidden" htmlFor="hero-ask">
              Ask about DevFest Lagos
            </label>
            <svg
              className="hero__ask-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="6.6"
                cy="6.6"
                r="5.35"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10.6 10.6L15.1 15.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              id="hero-ask"
              className="hero__ask-input"
              type="search"
              name="q"
              placeholder="Ask me anything..."
              autoComplete="off"
            />
          </form>
        </div>
      </div>
    </section>
  );
}
