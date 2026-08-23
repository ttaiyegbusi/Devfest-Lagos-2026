"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { Body, Constraint, Engine, World } from "matter-js";
import type { Pill } from "./tracks";

// The pills are real DOM elements — the text stays selectable, searchable and
// crisp — and the engine only ever hands each one a position and an angle.
// Drawing them into a canvas would cost all of that for nothing.
//
// matter-js is imported on demand as the panel comes into view, so it stays out
// of the initial bundle for anyone who never scrolls this far.

/** Simulated pixels per second squared. Under Earth's 1.0 on purpose: these
 *  are paper chips, and they should drift down rather than drop like stone. */
const GRAVITY = 0.95;
/** Seconds between successive pills entering. */
const DROP_INTERVAL = 0.09;
/** Fixed physics step, ms. Fixed rather than frame-derived: a slow frame would
 *  otherwise let a pill tunnel straight through the floor. */
const STEP_MS = 1000 / 60;
/** How densely loose stadium shapes settle. Measured off the real heap rather
 *  than derived: random rounded rectangles pack a little under 60%. */
const PACK = 0.58;
/** How much harder than its outline implies a pill is to spin. A stadium of card
 *  falling through air does not tumble the way a rigid bar in a vacuum does — it
 *  is damped by its own face, and matter models no such thing. Without this,
 *  better than one pill in twelve lands past 90 degrees, and a label nobody can
 *  read is the one thing a panel whose whole job is naming topics cannot afford.
 *  It costs nothing at rest and is barely perceptible on a drag. */
const SPIN_RESISTANCE = 4;
/** Frames of no visible movement before the heap counts as finished — half a
 *  second at the fixed step, which is longer than the pause at the top of a
 *  bounce and shorter than anyone will notice it thinking about it. */
const STILL_FRAMES = 30;
/** Movement below this, in px per step, is not movement. */
const STILL_EPS = 0.05;
/** Ceiling on the *estimate* below — not on the finished heap. The trim is
 *  allowed to reopen the box past this, because a heap with its top row cut off
 *  is worse than a panel that runs longer than the screen, and the stack is
 *  built for panels taller than one stage. With the cloud at twenty-four pills
 *  the trim reopens it on every viewport, so this now only keeps the opening
 *  guess sane. */
const MAX_VH = 0.62;

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia?.(REDUCED);
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const readReduced = () => window.matchMedia?.(REDUCED).matches ?? false;
/** The server has no media queries to read. Motion is the shared default, and
 *  the first client render corrects it before the pit is ever built. */
const readReducedOnServer = () => false;

/** matter tracks, on the constraint, the body angle each attachment point was
 *  last measured against. The published types do not describe it, and a drag
 *  constraint cannot be correct without it — see the grab in `onDown`. */
type DragConstraint = Constraint & { angleB: number };

interface Sim {
  engine: Engine;
  world: World;
  bodies: Body[];
  drag: DragConstraint;
  M: typeof import("matter-js");
  /** Box height the heap was estimated into, before any trim. */
  height: number;
  /** Viewport width the walls and every pill width were measured at. */
  viewW: number;
  /** The heap is only trimmed to its real height once. */
  trimmed: boolean;
  /** Last frame's x, y and angle per body, flat, for the stillness test. */
  prev: Float64Array;
  /** Consecutive frames the whole heap has not visibly moved for. */
  still: number;
}

export function PillPit({ rows }: { rows: Pill[][] }) {
  const pills = rows.flat();

  const pitRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const simRef = useRef<Sim | null>(null);
  const rafRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  /**
   * Bumped on teardown to invalidate a build still awaiting its import. Strict
   * Mode mounts twice, and without this the second mount starts a second world
   * and a second render loop while the first is still resolving — two engines
   * writing to the same pills.
   */
  const genRef = useRef(0);

  const reduced = useSyncExternalStore(
    subscribeReduced,
    readReduced,
    readReducedOnServer,
  );

  const teardown = useCallback(() => {
    genRef.current += 1;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    cleanupRef.current?.();
    cleanupRef.current = null;
    const sim = simRef.current;
    if (sim) {
      sim.M.World.clear(sim.world, false);
      sim.M.Engine.clear(sim.engine);
      simRef.current = null;
    }
  }, []);

  const build = useCallback(async () => {
    const pit = pitRef.current;
    if (!pit || simRef.current) return;

    const gen = genRef.current;
    const M = await import("matter-js");
    // Torn down, or superseded, while the import was in flight.
    if (gen !== genRef.current || !pitRef.current || simRef.current) return;

    const { Engine, Bodies, Composite, Constraint, Sleeping, Query } = M;
    const W = pit.clientWidth;
    if (!W) return;

    // The pills come to rest in a heap on the floor, so the box only ever needs
    // to be as tall as that heap — any more is a void above it, which is what
    // a fixed height gave us. Estimate the heap from the area the pills
    // actually occupy at this width, plus one pill of headroom for the last
    // arrivals to land in. They fall in from outside the box, so none of this
    // has to leave room for the drop itself.
    const sizes = pillRefs.current
      .filter((el): el is HTMLDivElement => Boolean(el))
      .map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
    if (sizes.length === 0) return;

    const area = sizes.reduce((sum, d) => sum + d.w * d.h, 0);
    const tallest = sizes.reduce((max, d) => Math.max(max, d.h), 0);
    const heap = Math.min(
      area / (W * PACK) + tallest,
      window.innerHeight * MAX_VH,
    );
    pit.style.height = `${Math.round(heap)}px`;

    const H = pit.clientHeight;
    if (!H) return;

    const engine = Engine.create();
    engine.gravity.y = GRAVITY;
    engine.enableSleeping = true;
    const world = engine.world;

    // Walls sit outside the visible box so their edges never show.
    const T = 240;
    Composite.add(world, [
      Bodies.rectangle(W / 2, H + T / 2, W + T * 2, T, { isStatic: true }),
      Bodies.rectangle(-T / 2, H / 2, T, H * 4, { isStatic: true }),
      Bodies.rectangle(W + T / 2, H / 2, T, H * 4, { isStatic: true }),
    ]);

    // One body per pill, sized from what the DOM actually measured, so the
    // physics outline matches the rendered pill at any font size.
    const bodies: Body[] = [];
    pillRefs.current.forEach((el, i) => {
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      bodies.push(
        Bodies.rectangle(
          // Spread the entry points across the width, off the very edges.
          W * (0.16 + 0.68 * ((i + 0.5) / pills.length)),
          // Stagger above the top so they arrive as a cascade, not a curtain.
          -h - i * (H * 0.55) * DROP_INTERVAL * 6,
          w,
          h,
          {
            // A stadium outline. A full h/2 can degenerate, so stay inside it.
            chamfer: { radius: h / 2 - 1 },
            restitution: 0.4,
            friction: 0.38,
            // Air drag and density carry the weight of the thing more than
            // gravity does: a chip of card has plenty of face for its mass, so
            // it is slowed by the air on the way down and lands softly instead
            // of driving into the heap.
            frictionAir: 0.02,
            density: 0.0011,
            angle: (Math.random() - 0.5) * 0.35,
            sleepThreshold: 90,
          },
        ),
      );
    });
    for (const b of bodies) M.Body.setInertia(b, b.inertia * SPIN_RESISTANCE);
    Composite.add(world, bodies);

    // Our own pointer handling rather than matter's MouseConstraint: that binds
    // wheel and touchmove with preventDefault, which stops the page scrolling
    // past this panel.
    const drag = Constraint.create({
      pointA: { x: 0, y: 0 },
      // Required up front even though the body is attached on grab: without it
      // Constraint.create dereferences pointB while working out its length.
      pointB: { x: 0, y: 0 },
      stiffness: 0.14,
      damping: 0.12,
      length: 0,
      render: { visible: false },
    }) as DragConstraint;

    simRef.current = {
      engine,
      world,
      bodies,
      drag,
      M,
      height: H,
      viewW: window.innerWidth,
      trimmed: false,
      prev: new Float64Array(bodies.length * 3),
      still: 0,
    };

    const local = (e: PointerEvent) => {
      const r = pit.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    /** Write one body's position onto its pill. Rounded once the heap is done:
     *  a whole-pixel offset is what lets the glyphs land back on the pixel grid
     *  they were hinted for. */
    const place = (sim: Sim, i: number, snap: boolean) => {
      const el = pillRefs.current[i];
      const b = sim.bodies[i];
      if (!el) return;
      const x = b.position.x - el.offsetWidth / 2;
      const y = b.position.y - el.offsetHeight / 2;
      // A body whose position has gone bad would serialise to a transform the
      // parser rejects, which silently leaves the last good one in place. Skip
      // it explicitly rather than relying on that.
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(b.angle))
        return;
      el.style.transform = snap
        ? `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) rotate(${b.angle.toFixed(4)}rad)`
        : `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${b.angle.toFixed(4)}rad)`;
    };

    let acc = 0;
    let last = performance.now();

    /**
     * The heap is asleep and nothing is going to move it until someone takes
     * hold of a pill. Stop the loop — a marketing page has no business holding
     * a phone at 60fps to redraw a picture that is not changing — and park the
     * pills for reading: whole-pixel offsets, and `is-settled` to take the
     * compositor layer off (see Expect.css) so the type is painted at its angle
     * rather than resampled out of a texture.
     */
    const settle = (sim: Sim) => {
      for (let i = 0; i < sim.bodies.length; i++) place(sim, i, true);
      pit.classList.add("is-settled");
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const sim = simRef.current;
      if (!sim) return;

      // Clamped so a backgrounded tab does not try to catch up in one go.
      acc += Math.min(now - last, 100);
      last = now;
      while (acc >= STEP_MS) {
        M.Engine.update(sim.engine, STEP_MS);
        acc -= STEP_MS;
      }

      // Whether the heap is *finished* is asked of the picture, not of the
      // engine. matter's own sleep flags looked like the obvious test and are
      // the wrong one: a single body that has been knocked out of the
      // simulation never sets its flag, and one such body holds the loop open
      // for ever. Comparing each body against where it was last frame asks the
      // only question that actually matters — has anything on screen moved? —
      // and a body with a bad position fails the `> EPS` test, so it counts as
      // still rather than blocking.
      let motion = 0;
      for (let i = 0; i < sim.bodies.length; i++) {
        const b = sim.bodies[i];
        const j = i * 3;
        // A turn of `da` moves a pill's far end by about da x half its
        // diagonal; 60px stands in for that across the sizes in play here.
        const d =
          Math.abs(b.position.x - sim.prev[j]) +
          Math.abs(b.position.y - sim.prev[j + 1]) +
          Math.abs(b.angle - sim.prev[j + 2]) * 60;
        sim.prev[j] = b.position.x;
        sim.prev[j + 1] = b.position.y;
        sim.prev[j + 2] = b.angle;
        if (d > motion) motion = d;
      }
      sim.still = motion > STILL_EPS ? 0 : sim.still + 1;
      const asleep = sim.still >= STILL_FRAMES;

      // The estimate above only ever gets the heap roughly right, and it errs
      // in both directions: too tall leaves a void over the pills, too short
      // piles them up over the copy. So once the heap has come to rest, fit the
      // box to it. The correction is symmetric — a heap sitting low is trimmed
      // up, one poking out of the top pushes the box open — and everything,
      // floor and walls included, moves with it, so the heap keeps its footing.
      if (!sim.trimmed && asleep) {
        sim.trimmed = true;
        const top = sim.bodies.reduce(
          (min, b) => Math.min(min, b.bounds.min.y),
          Infinity,
        );
        const slack = Math.round(top - 8);
        if (Math.abs(slack) > 8) {
          sim.M.Composite.translate(sim.world, { x: 0, y: -slack }, true);
          pit.style.height = `${sim.height - slack}px`;
        }
      }

      if (asleep && sim.trimmed) {
        settle(sim);
        return;
      }

      for (let i = 0; i < sim.bodies.length; i++) place(sim, i, false);
    };

    /** Something is about to move again, so put the loop back. */
    const wake = () => {
      pit.classList.remove("is-settled");
      const sim = simRef.current;
      if (sim) sim.still = 0;
      if (rafRef.current) return;
      acc = 0;
      last = performance.now();
      rafRef.current = requestAnimationFrame(frame);
    };

    const onDown = (e: PointerEvent) => {
      const sim = simRef.current;
      if (!sim) return;
      const p = local(e);
      const hit = Query.point(sim.bodies, p).pop();
      // A miss leaves the event alone, so the page still scrolls.
      if (!hit) return;
      Sleeping.set(hit, false);
      // Grab offset, in the body's own frame so it rotates with it.
      const dx = p.x - hit.position.x;
      const dy = p.y - hit.position.y;
      const a = -hit.angle;
      sim.drag.bodyB = hit;
      // `angleB` is the body angle that `pointB` is measured against, and every
      // solve rotates pointB by the difference between the two. Constraint.create
      // only fills it in when a body is attached up front, and this one attaches
      // on grab — so it is left *undefined*, the first solve after a grab works
      // out `body.angle - undefined`, and rotating pointB by that NaN poisons
      // the body's position permanently. The pill then stops moving and can
      // never be picked up again, which in a heap reads as a pill that has
      // simply come to rest. It has to be set with the body, on every grab.
      sim.drag.angleB = hit.angle;
      sim.drag.pointB = {
        x: dx * Math.cos(a) - dy * Math.sin(a),
        y: dx * Math.sin(a) + dy * Math.cos(a),
      };
      sim.drag.pointA = p;
      Composite.add(sim.world, sim.drag);
      pit.setPointerCapture(e.pointerId);
      pit.classList.add("is-grabbing");
      wake();
      e.preventDefault();
    };

    const onMove = (e: PointerEvent) => {
      const sim = simRef.current;
      if (!sim?.drag.bodyB) return;
      sim.drag.pointA = local(e);
      Sleeping.set(sim.drag.bodyB, false);
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      const sim = simRef.current;
      if (!sim?.drag.bodyB) return;
      Composite.remove(sim.world, sim.drag);
      sim.drag.bodyB = null;
      try {
        pit.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
      pit.classList.remove("is-grabbing");
    };

    pit.addEventListener("pointerdown", onDown);
    pit.addEventListener("pointermove", onMove);
    pit.addEventListener("pointerup", onUp);
    pit.addEventListener("pointercancel", onUp);

    rafRef.current = requestAnimationFrame(frame);

    cleanupRef.current = () => {
      pit.removeEventListener("pointerdown", onDown);
      pit.removeEventListener("pointermove", onMove);
      pit.removeEventListener("pointerup", onUp);
      pit.removeEventListener("pointercancel", onUp);
      pit.classList.remove("is-settled", "is-grabbing");
    };
  }, [pills.length]);

  // Start the drop the first time the panel comes into view.
  useEffect(() => {
    if (reduced) return;
    const pit = pitRef.current;
    if (!pit) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        void build();
      },
      { threshold: 0.2 },
    );
    io.observe(pit);

    return () => {
      io.disconnect();
      teardown();
    };
  }, [reduced, build, teardown]);

  // Rebuild on resize — the walls and the pills' own widths both move.
  //
  // Only on a change of *width*, though. A phone browser fires `resize` every
  // time its address bar slides in or out, which is precisely what scrolling
  // back up the page does, and rebuilding there dropped the whole heap again —
  // several times on the way up. Nothing about the sim depends on the viewport
  // height: the walls, the entry points and every pill's own width all come
  // from the width. So a height-only resize is the browser's chrome moving, not
  // the layout changing, and the right response is to leave the heap alone.
  useEffect(() => {
    if (reduced) return;
    let t = 0;
    const onResize = () => {
      const sim = simRef.current;
      if (!sim || window.innerWidth === sim.viewW) return;
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        if (!simRef.current) return;
        teardown();
        pillRefs.current.forEach((el) => {
          if (el) el.style.transform = "";
        });
        void build();
      }, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced, build, teardown]);

  // Anyone who has asked for less motion gets the cloud laid out statically, in
  // the rows the design sets by hand.
  if (reduced) {
    return (
      <ul className="pills">
        {rows.map((row, r) => (
          <li key={r} className="pills__row">
            <ul className="pills__line">
              {row.map((pill) => (
                <li
                  key={pill.label}
                  className="pills__pill"
                  style={{
                    ["--pill-bg" as string]: pill.bg,
                    ["--pill-fg" as string]: pill.fg,
                  }}
                >
                  {pill.label}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="pit" ref={pitRef} aria-hidden="true">
        {pills.map((pill, i) => (
          <div
            key={pill.label}
            className="pills__pill pit__pill"
            ref={(el) => {
              pillRefs.current[i] = el;
            }}
            style={{
              ["--pill-bg" as string]: pill.bg,
              ["--pill-fg" as string]: pill.fg,
              // Parked out of sight until the engine takes over, rather than
              // flashing in their document position for a frame.
              transform: "translate3d(0, -200vh, 0)",
            }}
          >
            {pill.label}
          </div>
        ))}
      </div>

      {/* The pit is decorative; keep the list itself readable. */}
      <ul className="visually-hidden">
        {pills.map((pill) => (
          <li key={pill.label}>{pill.label}</li>
        ))}
      </ul>
    </>
  );
}
