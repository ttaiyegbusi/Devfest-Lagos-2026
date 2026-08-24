"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SPEAKERS } from "./lineup";
import "./Speakers.css";

const COUNT = SPEAKERS.length;

/** How fast the wall settles onto a card, per second. */
const SETTLE = 9;
/** Where a card starts to fade, and where it has gone entirely.
 *
 *  Two steps out is as far as the wall is calibrated to go: past that the
 *  perspective is bringing a card so far forward that it projects half again as
 *  wide as the centre one. So the fade runs out over the third step, and since
 *  a seven-card ring never puts a card further than 3.5 steps away, every card
 *  is invisible at the moment it is carried round to the other side. That is
 *  what makes the row endless without a seam — and without ever showing a card
 *  at a size the geometry was not solved for. */
const FADE_FROM = 2;
const FADE_TO = 2.5;
/** Pointer travel, in px, past which a press counts as a drag and not a click. */
const SLOP = 3;
/** Degrees of arc between neighbouring cards. */
const ARC = 18.5;

/** Distance from the wall's position to card `i`, taking the short way round.
 *  This is the whole trick: the card furthest off to the left is also the one
 *  about to arrive on the right, so there are no ends to run out of. */
function wrapped(d: number) {
  const x = ((d % COUNT) + COUNT) % COUNT;
  return x > COUNT / 2 ? x - COUNT : x;
}

/** The position as an index into the lineup, for the label and the progress. */
const asIndex = (v: number) => ((Math.round(v) % COUNT) + COUNT) % COUNT;

export function Speakers() {
  const trackId = useId();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slots = useRef<(HTMLLIElement | null)[]>([]);

  /* The wall's position is a float, not an index — that is what lets it be
     dragged between cards rather than only snapped between them. It is left
     unbounded and wrapped at the point of use, so it never needs a discontinuity
     of its own. */
  const pos = useRef(0);
  const target = useRef(0);
  const raf = useRef(0);
  const last = useRef(0);
  const grabbing = useRef(false);
  const still = useRef(false);

  const [active, setActive] = useState(0);

  const paint = useCallback(() => {
    for (let i = 0; i < COUNT; i++) {
      const el = slots.current[i];
      if (!el) continue;

      const offset = wrapped(i - pos.current);
      const n = Math.abs(offset);

      // Cards sit on a circle of radius --arc-r, one ARC of turn apart. A card
      // at angle t is at (R sin t, R(1 - cos t)) and faces along the tangent,
      // which is the whole definition of lying on an arc: rotation and position
      // come from the same angle, so the row reads as one curved surface.
      // Deriving x and z from separate curves — a power law and a linear depth,
      // as this did before — leaves every card facing slightly wrong for where
      // it actually is, and the arc looks broken.
      const t = (offset * ARC * Math.PI) / 180;
      el.style.transform = [
        `translateX(calc(var(--arc-r) * ${Math.sin(t).toFixed(5)}))`,
        `translateZ(calc(var(--arc-r) * ${(1 - Math.cos(t)).toFixed(5)}))`,
        `rotateY(${(-offset * ARC).toFixed(3)}deg)`,
      ].join(" ");

      const opacity =
        n <= FADE_FROM
          ? 1
          : Math.max(0, 1 - (n - FADE_FROM) / (FADE_TO - FADE_FROM));
      el.style.opacity = opacity.toFixed(3);

      // A card that has faded out is about to be carried round; it should be
      // out of the tab order and out of the way of the pointer while it is.
      const gone = opacity <= 0.01;
      el.toggleAttribute("data-far", gone);
      const button = el.firstElementChild;
      if (button instanceof HTMLElement) button.tabIndex = gone ? -1 : 0;
    }
  }, []);

  // A named function expression so the loop can re-request itself without
  // reaching for the binding it is still being assigned to.
  const tick = useCallback(
    function frame(now: number) {
      // Clamped so a backgrounded tab does not resolve the whole travel in one
      // enormous step when it comes back.
      const dt = Math.min((now - last.current) / 1000, 0.05);
      last.current = now;

      if (!grabbing.current) {
        const gap = target.current - pos.current;
        if (still.current || Math.abs(gap) < 0.0005) {
          pos.current = target.current;
        } else {
          // Framerate-independent ease, so the settle takes the same time on a
          // 60Hz panel and a 120Hz one.
          pos.current += gap * (1 - Math.exp(-dt * SETTLE));
        }
      }

      paint();

      const done =
        !grabbing.current && Math.abs(target.current - pos.current) < 0.0005;
      raf.current = done ? 0 : requestAnimationFrame(frame);
    },
    [paint],
  );

  const kick = useCallback(() => {
    if (raf.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  /** Step by whole cards. There is no clamping — that is the point. */
  const go = useCallback(
    (delta: number) => {
      target.current = Math.round(target.current) + delta;
      setActive(asIndex(target.current));
      kick();
    },
    [kick],
  );

  /** Bring card `i` to the centre, going whichever way round is shorter. */
  const goTo = useCallback(
    (i: number) => {
      const from = Math.round(target.current);
      target.current = from + Math.round(wrapped(i - from));
      setActive(asIndex(target.current));
      kick();
    },
    [kick],
  );

  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paint();
  }, [paint]);

  useEffect(() => {
    const el = stage.current;
    const section = root.current;
    if (!el || !section) return;

    let startX = 0;
    let startPos = 0;
    let step = 353;
    let dragged = false;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // One --step of travel is one card, so the wall keeps pace with the
      // cursor at every breakpoint.
      step =
        parseFloat(getComputedStyle(section).getPropertyValue("--step")) || 353;
      startX = event.clientX;
      startPos = pos.current;
      dragged = false;
      grabbing.current = true;
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* no capture available; the listeners still track the drag */
      }
      el.classList.add("is-grabbing");
      kick();
    };

    const onMove = (event: PointerEvent) => {
      if (!grabbing.current) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > SLOP) dragged = true;
      pos.current = startPos - dx / step;
      target.current = pos.current;
      kick();
    };

    const onUp = (event: PointerEvent) => {
      if (!grabbing.current) return;
      grabbing.current = false;
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* pointer already gone */
      }
      el.classList.remove("is-grabbing");
      target.current = Math.round(pos.current);
      setActive(asIndex(target.current));
      kick();

      // A drag that finishes over a card would otherwise also count as a click
      // on it, and pull the wall somewhere the reader did not ask for.
      if (dragged) {
        el.addEventListener(
          "click",
          (click) => {
            click.stopPropagation();
            click.preventDefault();
          },
          { capture: true, once: true },
        );
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("keydown", onKey);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("keydown", onKey);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [go, kick]);

  return (
    <section
      className="speakers"
      id="speakers"
      aria-labelledby={`${trackId}-title`}
      ref={root}
    >
      <div className="speakers__intro" data-reveal>
        <h2 className="speakers__title" id={`${trackId}-title`} data-rise>
          Meet Our Speakers
        </h2>
        <p className="speakers__lede" data-rise>
          We&rsquo;ve raised the bar this year with our impressive lineup of
          speakers, each prepared to share valuable insights.
        </p>
      </div>

      {/* Fade only, and on the stage itself: this element carries the
          perspective the whole wall is built in, so it can neither travel
          under a rise nor be wrapped in something that would come between it
          and the track. */}
      <div
        className="speakers__stage"
        data-reveal
        data-rise="still"
        ref={stage}
        tabIndex={-1}
        role="group"
        aria-roledescription="carousel"
        aria-label="Speaker lineup"
      >
        <ul className="speakers__track" id={trackId}>
          {SPEAKERS.map((s, i) => (
            <li
              key={s.org}
              className="speakers__slot"
              ref={(el) => {
                slots.current[i] = el;
              }}
              data-current={i === active || undefined}
              aria-current={i === active ? "true" : undefined}
            >
              <button
                type="button"
                className="card"
                onClick={() => goTo(i)}
                /* Only the centred card is a destination; the rest are a way
                   of getting to it — hence the "Show". Both forms name the
                   speaker and the role now that both are printed on the card:
                   a label that leaves out visible words is one a voice-control
                   user cannot say (WCAG 2.5.3, Label in Name). */
                aria-label={
                  i === active
                    ? `${s.speaker}, ${s.role} at ${s.org}`
                    : `Show ${s.speaker}, ${s.role} at ${s.org}`
                }
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
                {/* Under the screen rather than over it: the organisation is
                    the artwork, the person is the caption. */}
                <span className="card__caption">
                  <span className="card__name">{s.speaker}</span>
                  <span className="card__role">{s.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="speakers__controls" data-reveal data-rise>
        <button
          type="button"
          className="speakers__arrow"
          onClick={() => go(-1)}
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
              ["--count" as string]: COUNT,
              ["--index" as string]: active,
            }}
          />
        </span>

        <button
          type="button"
          className="speakers__arrow"
          onClick={() => go(1)}
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
        {SPEAKERS[active].org}. {active + 1} of {COUNT}.
      </p>
    </section>
  );
}
