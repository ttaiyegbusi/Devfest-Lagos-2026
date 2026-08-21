"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Body, Constraint, Engine, World } from "matter-js";
import type { Pill } from "./tracks";

// The pills are real DOM elements — the text stays selectable, searchable and
// crisp — and the engine only ever hands each one a position and an angle.
// Drawing them into a canvas would cost all of that for nothing.
//
// matter-js is imported on demand as the panel comes into view, so it stays out
// of the initial bundle for anyone who never scrolls this far.

/** Simulated pixels per second squared. */
const GRAVITY = 1.25;
/** Seconds between successive pills entering. */
const DROP_INTERVAL = 0.09;
/** Fixed physics step, ms. Fixed rather than frame-derived: a slow frame would
 *  otherwise let a pill tunnel straight through the floor. */
const STEP_MS = 1000 / 60;
/** How densely loose stadium shapes settle. Measured off the real heap rather
 *  than derived: random rounded rectangles pack a little under 60%. */
const PACK = 0.58;
/** Most of the screen the heap may ever take. */
const MAX_VH = 0.62;

interface Sim {
  engine: Engine;
  world: World;
  bodies: Body[];
  drag: Constraint;
  M: typeof import("matter-js");
  /** Box height the heap was estimated into, before any trim. */
  height: number;
  /** The heap is only trimmed to its real height once. */
  trimmed: boolean;
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
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    );
  }, []);

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
            frictionAir: 0.012,
            density: 0.0014,
            angle: (Math.random() - 0.5) * 0.35,
            sleepThreshold: 90,
          },
        ),
      );
    });
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
    });

    simRef.current = { engine, world, bodies, drag, M, height: H, trimmed: false };

    const local = (e: PointerEvent) => {
      const r = pit.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
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
      sim.drag.pointB = {
        x: dx * Math.cos(a) - dy * Math.sin(a),
        y: dx * Math.sin(a) + dy * Math.cos(a),
      };
      sim.drag.pointA = p;
      Composite.add(sim.world, sim.drag);
      pit.setPointerCapture(e.pointerId);
      pit.classList.add("is-grabbing");
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

    let acc = 0;
    let last = performance.now();
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

      // The estimate above only ever gets the heap roughly right, and it errs
      // in both directions: too tall leaves a void over the pills, too short
      // piles them up over the copy. So once the heap has come to rest, fit the
      // box to it. The correction is symmetric — a heap sitting low is trimmed
      // up, one poking out of the top pushes the box open — and everything,
      // floor and walls included, moves with it, so the heap keeps its footing.
      if (!sim.trimmed && sim.bodies.every((b) => b.isSleeping)) {
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

      for (let i = 0; i < sim.bodies.length; i++) {
        const el = pillRefs.current[i];
        const b = sim.bodies[i];
        if (!el) continue;
        const x = b.position.x - el.offsetWidth / 2;
        const y = b.position.y - el.offsetHeight / 2;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(
          1,
        )}px, 0) rotate(${b.angle.toFixed(4)}rad)`;
      }
    };
    rafRef.current = requestAnimationFrame(frame);

    cleanupRef.current = () => {
      pit.removeEventListener("pointerdown", onDown);
      pit.removeEventListener("pointermove", onMove);
      pit.removeEventListener("pointerup", onUp);
      pit.removeEventListener("pointercancel", onUp);
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
  useEffect(() => {
    if (reduced) return;
    let t = 0;
    const onResize = () => {
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
