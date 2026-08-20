import { TRACKS } from "./tracks";
import "./Expect.css";

export function Expect() {
  return (
    <section className="expect" aria-labelledby="expect-title">
      <div className="expect__intro">
        <h2 className="expect__title" id="expect-title">
          What to expect this year!
        </h2>
        <p className="expect__lede">
          Dive into the most complete visual library out there, curated to help
          you discover the references.
        </p>
      </div>

      <ul className="expect__fan">
        {TRACKS.map((t) => (
          <li
            key={t.n}
            className="expect__card"
            style={{
              ["--bg" as string]: t.bg,
              ["--ink" as string]: t.ink,
              ["--tilt" as string]: `${t.tilt}deg`,
              ["--lift" as string]: `${t.lift}px`,
            }}
          >
            <p className="expect__n" aria-hidden="true">
              {t.n}
            </p>
            <h3 className="expect__name">
              {t.title.split("\n").map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </h3>
            <p className="expect__blurb">{t.blurb}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
