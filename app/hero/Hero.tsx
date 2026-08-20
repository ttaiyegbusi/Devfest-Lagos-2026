import { HeroNav } from "./HeroNav";
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
            One <span className="hero__accent">Ecosystem</span>,
            <br />
            Endless Opportunities.
          </h1>

          <p className="hero__lede">
            Join the largest annual tech conference in Africa, hosted by
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
                cx="7"
                cy="7"
                r="5.25"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11 11L14.5 14.5"
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
