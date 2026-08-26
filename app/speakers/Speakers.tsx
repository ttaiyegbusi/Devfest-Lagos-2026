"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Speaker } from "./lineup";
import "./Speakers.css";

/* The ring needs enough cards to hide its own seam. A card is carried round to
   the other side while it is invisible, and it only becomes invisible at
   FADE_TO steps out — so below 2 * FADE_TO cards there is no distance at which
   a card can make the crossing unseen, and the same face would show twice at
   once. A short lineup gets a plain row instead: the same cards, no ring. */
const RING_MINIMUM = 5;

/** How fast the wall settles onto a card, per second. */
const SETTLE = 9;
/** Seconds a card takes to travel one place while the wall is drifting on its
 *  own. The sponsors band crosses a name every 3.4s and this is deliberately a
 *  little slower: those are wordmarks to glance at, these are a name, a role
 *  and an organisation to actually read. */
const PACE = 4.2;
/** The same thing the ring can use directly: places per second. */
const DRIFT = 1 / PACE;
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
function wrapped(d: number, count: number) {
  const x = ((d % count) + count) % count;
  return x > count / 2 ? x - count : x;
}

/** The position as an index into the lineup, for the label and the progress. */
const asIndex = (v: number, count: number) =>
  ((Math.round(v) % count) + count) % count;

export function Speakers({ speakers }: { speakers: Speaker[] }) {
  const COUNT = speakers.length;
  const trackId = useId();
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
  /** Easing towards a card somebody asked for, rather than drifting. */
  const seeking = useRef(false);
  /** Under the pointer or holding focus — the reader is looking at something. */
  const held = useRef(false);
  /** Scrolled past. Starts true: the wall is well below the fold, and there is
   *  no sense turning the ring while nobody is in front of it. */
  const away = useRef(true);
  /** The index the cards are currently drawn against, so the frame can tell
   *  when the centre has actually changed rather than setting state at 60Hz. */
  const shown = useRef(0);

  /* Two indices, because they answer to different things. `active` is which
     card is in the middle and drives the highlight and the progress thumb, so
     it follows the wall wherever the wall goes — drift included. `spoken` is
     what the live region says, and it only moves when somebody *asks* for a
     card: a wall that drifts on its own would otherwise read a new name aloud
     every four seconds, for ever. */
  const [active, setActive] = useState(0);
  const [spoken, setSpoken] = useState(0);

  const paint = useCallback(() => {
    for (let i = 0; i < COUNT; i++) {
      const el = slots.current[i];
      if (!el) continue;

      const offset = wrapped(i - pos.current, COUNT);
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
  }, [COUNT]);

  // A named function expression so the loop can re-request itself without
  // reaching for the binding it is still being assigned to.
  const tick = useCallback(
    function frame(now: number) {
      // Clamped so a backgrounded tab does not resolve the whole travel in one
      // enormous step when it comes back.
      const dt = Math.min((now - last.current) / 1000, 0.05);
      last.current = now;

      if (grabbing.current) {
        // The pointer handlers are writing `pos`; there is nothing to integrate.
      } else if (seeking.current) {
        const gap = target.current - pos.current;
        if (still.current || Math.abs(gap) < 0.0005) {
          pos.current = target.current;
          seeking.current = false;
        } else {
          // Framerate-independent ease, so the settle takes the same time on a
          // 60Hz panel and a 120Hz one.
          pos.current += gap * (1 - Math.exp(-dt * SETTLE));
        }
      } else if (!still.current && !held.current && !away.current) {
        // The drift. `pos` is unbounded and wrapped at the point of use, so it
        // can climb for ever without ever needing a discontinuity — which is
        // what makes this endless rather than a loop with a seam in it.
        pos.current += DRIFT * dt;
        target.current = pos.current;
      }

      paint();

      const centre = asIndex(pos.current, COUNT);
      if (centre !== shown.current) {
        shown.current = centre;
        setActive(centre);
      }

      const idle =
        !grabbing.current &&
        !seeking.current &&
        (still.current || held.current || away.current);
      raf.current = idle ? 0 : requestAnimationFrame(frame);
    },
    [COUNT, paint],
  );

  const kick = useCallback(() => {
    if (raf.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  /** Step by whole cards. There is no clamping — that is the point.
   *
   *  `active` is not set here: it is derived from where the wall actually is,
   *  once a frame, so the highlight travels with the cards instead of jumping
   *  ahead of them. What is set here is what gets announced, because this is a
   *  reader asking for a card rather than the wall drifting past one. */
  const go = useCallback(
    (delta: number) => {
      target.current = Math.round(target.current) + delta;
      seeking.current = true;
      setSpoken(asIndex(target.current, COUNT));
      kick();
    },
    [COUNT, kick],
  );

  /** Bring card `i` to the centre, going whichever way round is shorter. */
  const goTo = useCallback(
    (i: number) => {
      const from = Math.round(target.current);
      target.current = from + Math.round(wrapped(i - from, COUNT));
      seeking.current = true;
      setSpoken(asIndex(target.current, COUNT));
      kick();
    },
    [COUNT, kick],
  );

  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paint();
  }, [paint]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;

    let startX = 0;
    let startPos = 0;
    let step = 353;
    let dragged = false;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // One --step of travel is one card, so the wall keeps pace with the
      // cursor at every breakpoint.
      // Read off the stage rather than the section: --step is set on .speakers
      // and inherits, and the section is no longer this component's to hold a
      // ref to — it moved out when the lineup was split by day. Reaching for a
      // ref that nothing carries is what silently killed the drag: the effect
      // bailed before attaching a single listener, so the wall answered its
      // arrows and ignored the pointer.
      step =
        parseFloat(getComputedStyle(el).getPropertyValue("--step")) || 353;
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
      // Snapping to the nearest card only makes sense if the wall is going to
      // stay there. While it is drifting it would settle onto a card and then
      // immediately slide off it again, which reads as a stumble — so the
      // drift simply picks up from wherever the hand left off. Under reduced
      // motion there is no drift, and the snap is the whole ending.
      if (still.current) {
        target.current = Math.round(pos.current);
        seeking.current = true;
      } else {
        target.current = pos.current;
      }
      setSpoken(asIndex(pos.current, COUNT));
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

    /* The wall stops while somebody is looking at it — the same courtesy the
       sponsors band pays on hover. Focus counts too: a keyboard reader tabbing
       through the cards should not have them moving underneath. */
    const hold = () => {
      held.current = true;
    };
    const release = () => {
      held.current = false;
      kick();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("keydown", onKey);
    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", release);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", release);

    /* And it does not turn at all until it is on screen. A ring animating at
       the bottom of a page nobody has scrolled to is a phone's battery spent
       on a picture nobody is looking at. */
    const io = new IntersectionObserver(
      ([entry]) => {
        away.current = !entry.isIntersecting;
        if (entry.isIntersecting) kick();
      },
      { threshold: 0 },
    );
    io.observe(el);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", release);
      io.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [COUNT, go, kick]);

  /* One card, drawn the same whether it is riding the ring or sitting in a
     plain row. The organisation is the artwork and the person is the caption
     under it — see Speakers.css. */
  const card = (s: Speaker, i: number, onRing: boolean) => (
    <button
      type="button"
      className="card"
      onClick={onRing ? () => goTo(i) : undefined}
      /* Only the centred card is a destination; the rest are a way of getting
         to it — hence the "Show". Both forms name the speaker and the role now
         that both are printed on the card: a label that leaves out visible
         words is one a voice-control user cannot say (WCAG 2.5.3, Label in
         Name). A card in a row is not a control at all, so it says nothing
         extra. */
      aria-label={
        !onRing || i === active
          ? `${s.name}, ${s.role} at ${s.org}`
          : `Show ${s.name}, ${s.role} at ${s.org}`
      }
      {...(onRing ? {} : { "aria-disabled": true, tabIndex: -1 })}
    >
      <span className="card__bar" aria-hidden="true">
        <span className="card__light" />
        <span className="card__menu" />
      </span>
      <span className="card__view">
        {s.image ? (
          <img className="card__art" src={s.image} alt="" loading="lazy" />
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
      {/* Under the screen rather than over it: the organisation is the
          artwork, the person is the caption. */}
      <span className="card__caption">
        <span className="card__name">{s.name}</span>
        <span className="card__role">{s.role}</span>
      </span>
    </button>
  );

  /* Too few to carry round without showing the seam. The cards are all there
     is to show, so show them all at once and drop the machinery. */
  if (COUNT < RING_MINIMUM) {
    return (
      <ul className="speakers__row" data-reveal>
        {speakers.map((s, i) => (
          <li key={`${s.name}-${s.org}`} data-rise style={{ ["--rise-i" as string]: i }}>
            {card(s, i, false)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
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
          {speakers.map((s, i) => (
            <li
              key={`${s.name}-${s.org}`}
              className="speakers__slot"
              ref={(el) => {
                slots.current[i] = el;
              }}
              data-current={i === active || undefined}
              aria-current={i === active ? "true" : undefined}
            >
              {card(s, i, true)}
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
        {speakers[spoken].name}, {speakers[spoken].role} at{" "}
        {speakers[spoken].org}. {spoken + 1} of {COUNT}.
      </p>
    </>
  );
}
