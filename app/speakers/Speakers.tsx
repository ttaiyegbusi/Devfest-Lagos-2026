"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SPEAKERS } from "./lineup";
import "./Speakers.css";

export function Speakers() {
  const [active, setActive] = useState(Math.floor(SPEAKERS.length / 2));
  const trackId = useId();
  const stage = useRef<HTMLDivElement>(null);

  const go = useCallback((next: number) => {
    setActive(Math.min(SPEAKERS.length - 1, Math.max(0, next)));
  }, []);

  // Arrow keys drive the carousel while it has focus, which is the behaviour
  // people expect once the buttons are reachable by keyboard anyway.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
      if (e.key === "ArrowRight") { e.preventDefault(); setActive((i) => Math.min(SPEAKERS.length - 1, i + 1)); }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="speakers" aria-labelledby={`${trackId}-title`}>
      <div className="speakers__intro">
        <h2 className="speakers__title" id={`${trackId}-title`}>
          Meet Our Speakers
        </h2>
        <p className="speakers__lede">
          We&rsquo;ve raised the bar this year with our impressive lineup of
          speakers, each prepared to share valuable insights.
        </p>
      </div>

      <div
        className="speakers__stage"
        ref={stage}
        tabIndex={-1}
        role="group"
        aria-roledescription="carousel"
        aria-label="Speaker lineup"
      >
        <ul
          className="speakers__track"
          id={trackId}
          style={{ ["--active" as string]: active }}
        >
          {SPEAKERS.map((s, i) => {
            const offset = i - active;
            return (
              <li
                key={s.org}
                className="speakers__slot"
                style={{ ["--i" as string]: i }}
                data-current={i === active || undefined}
                aria-current={i === active ? "true" : undefined}
              >
                <button
                  type="button"
                  className="card"
                  onClick={() => go(i)}
                  // Only the centred card is a destination; the rest are a way
                  // of getting to it.
                  aria-label={
                    i === active
                      ? `${s.speaker}, ${s.role} at ${s.org}`
                      : `Show ${s.org}`
                  }
                  tabIndex={Math.abs(offset) > 2 ? -1 : 0}
                >
                  <span className="card__bar" aria-hidden="true">
                    <span className="card__light" />
                    <span className="card__menu" />
                  </span>
                  <span className="card__view">
                    {s.image ? (
                      <img className="card__art" src={s.image} alt="" />
                    ) : (
                      <span
                        className="card__art card__art--placeholder"
                        style={{
                          ["--from" as string]: s.tint[0],
                          ["--to" as string]: s.tint[1],
                        }}
                      />
                    )}
                    <span className="card__org">{s.org}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="speakers__controls">
        <button
          type="button"
          className="speakers__arrow"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-controls={trackId}
        >
          <span className="visually-hidden">Previous speaker</span>
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
            <path d="M7 1 1 7l6 6M1 7h20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="speakers__progress" aria-hidden="true">
          <span
            className="speakers__thumb"
            style={{
              ["--count" as string]: SPEAKERS.length,
              ["--index" as string]: active,
            }}
          />
        </span>

        <button
          type="button"
          className="speakers__arrow"
          onClick={() => go(active + 1)}
          disabled={active === SPEAKERS.length - 1}
          aria-controls={trackId}
        >
          <span className="visually-hidden">Next speaker</span>
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
            <path d="M15 1l6 6-6 6M21 7H1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {SPEAKERS[active].speaker}, {SPEAKERS[active].role} at{" "}
        {SPEAKERS[active].org}. {active + 1} of {SPEAKERS.length}.
      </p>
    </section>
  );
}
