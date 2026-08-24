"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Body, Constraint, Engine, World } from "matter-js";

/* Hangs whatever it is given from a lanyard, and lets you pull it.
 *
 * THE CHILDREN ARE THE SECTION. They lay out and read as a plain grid with no
 * JavaScript, and everything below is an enhancement laid over that: the rack
 * only switches to physics once matter has loaded and the section is in view.
 * Scripting off, or `prefers-reduced-motion`, and the grid is what you get —
 * which is the whole section, prices and all, just not swinging. */

/* ONE SPRING, NOT A CHAIN. The first attempt hung each badge off three linked
   cord segments, and it collapsed: a link is a 3px circle and a badge is a
   quarter of a megapixel, so the badge outweighed the thing holding it several
   thousand times over and dragged the whole cord to the bottom of the page.
   A lanyard under tension is straight anyway, so the cord is one spring from
   the hook to the badge's top edge — stable, and it still stretches when
   pulled, which is the part that matters. */

/** How springy the cord is. The give under a pull comes from this; the sag at
 *  rest is kept small by the badge being light rather than by this being
 *  stiff, because a stiff spring has no pull left in it. */
const CORD_STIFFNESS = 0.14;
const CORD_DAMPING = 0.09;
/** Badge mass per pixel of area. Tuned against the measured rest sag — see
 *  scripts/lanyard.mjs, which fails if a badge hangs more than a few px below
 *  where the grid put it. */
const BADGE_DENSITY = 0.00008;
/** Simulated gravity. Under Earth's, so a released badge falls back with weight
 *  but does not snap. */
const GRAVITY = 0.9;
/** Fixed physics step, ms — a slow frame must not change the simulation. */
const STEP_MS = 1000 / 60;
/** Frames of no visible movement before the rack counts as at rest. */
const STILL_FRAMES = 40;
/** Movement below this, in px per step, is not movement. */
const STILL_EPS = 0.04;
/** How far below its hook a badge hangs. */
const CORD_LENGTH = 86;

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (fn: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};
const readReduced = () => window.matchMedia?.(REDUCED).matches ?? false;
const readReducedOnServer = () => false;

type DragConstraint = Constraint & { angleB: number };

interface Rig {
  badge: Body;
  el: HTMLElement;
  anchor: { x: number; y: number };
}

interface Sim {
  engine: Engine;
  world: World;
  M: typeof import("matter-js");
  rigs: Rig[];
  drag: DragConstraint;
  /** Last frame's position per badge, for the stillness test. */
  prev: Float64Array;
  still: number;
  /** Viewport width the slots were measured at. */
  viewW: number;
}

export function Lanyards({ children }: { children: ReactNode }) {
  const rackRef = useRef<HTMLDivElement>(null);
  const cordsRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Sim | null>(null);
  const rafRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  /* Bumped on teardown so a build still awaiting its import knows it has been
     superseded. Strict Mode mounts twice, and without this the second mount
     starts a second world writing to the same badges. */
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
    const rack = rackRef.current;
    if (rack) {
      rack.classList.remove("is-live");
      rack.style.height = "";
      for (const el of rack.querySelectorAll<HTMLElement>(".badge")) {
        el.style.transform = "";
        el.style.left = "";
        el.style.top = "";
      }
    }
  }, []);

  const build = useCallback(async () => {
    const rack = rackRef.current;
    const cords = cordsRef.current;
    if (!rack || !cords || simRef.current) return;

    const gen = genRef.current;
    const M = await import("matter-js");
    if (gen !== genRef.current || !rackRef.current || simRef.current) return;

    const { Engine, Bodies, Composite, Constraint } = M;
    const badges = Array.from(rack.querySelectorAll<HTMLElement>(".badge"));
    if (badges.length === 0) return;

    /* Measure the grid BEFORE taking the badges out of it: where each one
       already sits is exactly where it should hang, so the physics inherits the
       stylesheet's layout instead of duplicating it. */
    const rackBox = rack.getBoundingClientRect();
    const slots = badges.map((el) => {
      const b = el.getBoundingClientRect();
      return {
        el,
        w: b.width,
        h: b.height,
        x: b.left - rackBox.left + b.width / 2,
        y: b.top - rackBox.top + b.height / 2,
      };
    });

    // Room for the badge to be pulled down without the section clipping it.
    rack.style.height = `${Math.round(rackBox.height + CORD_LENGTH)}px`;
    rack.classList.add("is-live");

    const engine = Engine.create();
    engine.gravity.y = GRAVITY;
    const world = engine.world;
    const rigs: Rig[] = [];

    for (const slot of slots) {
      const anchor = { x: slot.x, y: slot.y - slot.h / 2 - CORD_LENGTH };

      const badge = Bodies.rectangle(slot.x, slot.y, slot.w, slot.h, {
        frictionAir: 0.055,
        density: BADGE_DENSITY,
        // Nothing here collides with anything else — two badges passing through
        // one another reads far better than two badges shoving.
        collisionFilter: { group: -1 },
      });

      /* Hung from its top edge, where the punch hole is, not from its middle.
         That single off-centre attachment is what makes it a badge rather than
         a box: the weight below the hook rights it, and a shove sets it
         swinging about the hook the way a real one does. */
      Composite.add(
        world,
        Constraint.create({
          pointA: anchor,
          bodyB: badge,
          pointB: { x: 0, y: -slot.h / 2 },
          length: CORD_LENGTH,
          stiffness: CORD_STIFFNESS,
          damping: CORD_DAMPING,
        }),
      );

      Composite.add(world, badge);
      rigs.push({ badge, el: slot.el, anchor });

      // The cord itself, drawn once and repositioned every frame.
      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      line.setAttribute("class", "rack__cord");
      line.setAttribute(
        "stroke",
        getComputedStyle(slot.el).getPropertyValue("--cord").trim() || "#171717",
      );
      cords.append(line);
    }

    /* `angleB` is the body angle `pointB` is measured against. Constraint.create
       only fills it in when a body is attached up front, and this one attaches
       on grab — so it is left undefined, the first solve works out
       `body.angle - undefined`, and rotating pointB by that NaN destroys the
       body's position for good. Same trap as the topic cloud's drag. */
    const drag = Constraint.create({
      pointA: { x: 0, y: 0 },
      pointB: { x: 0, y: 0 },
      length: 0,
      stiffness: 0.09,
      damping: 0.12,
    }) as DragConstraint;
    Composite.add(world, drag);

    const sim: Sim = {
      engine,
      world,
      M,
      rigs,
      drag,
      prev: new Float64Array(rigs.length * 2),
      still: 0,
      viewW: window.innerWidth,
    };
    simRef.current = sim;

    const place = () => {
      for (const rig of sim.rigs) {
        const b = rig.badge;
        if (!Number.isFinite(b.position.x) || !Number.isFinite(b.angle)) continue;
        rig.el.style.transform =
          `translate3d(${(b.position.x - rig.el.offsetWidth / 2).toFixed(1)}px, ` +
          `${(b.position.y - rig.el.offsetHeight / 2).toFixed(1)}px, 0) ` +
          `rotate(${b.angle.toFixed(4)}rad)`;
      }
      const lines = cords.querySelectorAll("polyline");
      sim.rigs.forEach((rig, i) => {
        const top = rig.badge.position;
        const angle = rig.badge.angle;
        // Where the cord meets the badge, carried round with the badge's turn.
        const half = rig.el.offsetHeight / 2;
        const hookX = top.x + Math.sin(angle) * half;
        const hookY = top.y - Math.cos(angle) * half;
        lines[i]?.setAttribute(
          "points",
          `${rig.anchor.x},${rig.anchor.y} ${hookX.toFixed(1)},${hookY.toFixed(1)}`,
        );
      });
    };

    let acc = 0;
    let last = performance.now();

    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const s = simRef.current;
      if (!s) return;
      acc += Math.min(now - last, 100);
      last = now;
      while (acc >= STEP_MS) {
        M.Engine.update(s.engine, STEP_MS);
        acc -= STEP_MS;
      }

      // Asking the picture whether anything moved, not the engine — a body
      // knocked out of the simulation never reports itself asleep and would
      // hold the loop open for ever.
      let motion = 0;
      let j = 0;
      for (const rig of s.rigs) {
        const dx = Math.abs(rig.badge.position.x - s.prev[j]);
        const dy = Math.abs(rig.badge.position.y - s.prev[j + 1]);
        s.prev[j] = rig.badge.position.x;
        s.prev[j + 1] = rig.badge.position.y;
        j += 2;
        if (dx + dy > motion) motion = dx + dy;
      }
      s.still = motion > STILL_EPS ? 0 : s.still + 1;

      place();

      // A marketing page has no business holding a phone at 60fps to redraw a
      // picture that is not changing.
      if (s.still >= STILL_FRAMES && !s.drag.bodyB) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        rack.classList.add("is-settled");
      }
    };

    const wake = () => {
      rack.classList.remove("is-settled");
      const s = simRef.current;
      if (s) s.still = 0;
      if (rafRef.current) return;
      acc = 0;
      last = performance.now();
      rafRef.current = requestAnimationFrame(frame);
    };

    const at = (event: PointerEvent) => {
      const box = rack.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };

    const onDown = (event: PointerEvent) => {
      const s = simRef.current;
      if (!s || s.drag.bodyB) return;
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(".badge");
      if (!el) return;

      /* A finger may only pull from the grip. The badges are large, and a touch
         that took the pointer anywhere on one would stop the page scrolling —
         so everywhere else on a badge stays `pan-y` and belongs to the browser.
         A mouse has no such conflict and may grab anywhere. */
      if (event.pointerType !== "mouse" && !target?.closest(".badge__grip")) return;

      const rig = s.rigs.find((r) => r.el === el);
      if (!rig) return;

      const p = at(event);
      s.drag.pointA = p;
      s.drag.bodyB = rig.badge;
      s.drag.angleB = rig.badge.angle;
      s.drag.pointB = {
        x: p.x - rig.badge.position.x,
        y: p.y - rig.badge.position.y,
      };
      rack.classList.add("is-pulling");
      rack.setPointerCapture(event.pointerId);
      event.preventDefault();
      wake();
    };

    const onMove = (event: PointerEvent) => {
      const s = simRef.current;
      if (!s?.drag.bodyB) return;
      s.drag.pointA = at(event);
      wake();
    };

    const onUp = (event: PointerEvent) => {
      const s = simRef.current;
      if (!s?.drag.bodyB) return;
      s.drag.bodyB = null;
      rack.classList.remove("is-pulling");
      if (rack.hasPointerCapture(event.pointerId)) rack.releasePointerCapture(event.pointerId);
      wake();
    };

    rack.addEventListener("pointerdown", onDown);
    rack.addEventListener("pointermove", onMove);
    rack.addEventListener("pointerup", onUp);
    rack.addEventListener("pointercancel", onUp);

    cleanupRef.current = () => {
      rack.removeEventListener("pointerdown", onDown);
      rack.removeEventListener("pointermove", onMove);
      rack.removeEventListener("pointerup", onUp);
      rack.removeEventListener("pointercancel", onUp);
      cords.replaceChildren();
    };

    place();
    wake();
  }, []);

  // Only once the rack is actually in view: a physics loop running against a
  // section nobody has scrolled to is pure battery.
  useEffect(() => {
    if (reduced) return;
    const rack = rackRef.current;
    if (!rack) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        void build();
      },
      { threshold: 0.15 },
    );
    io.observe(rack);
    return () => {
      io.disconnect();
      teardown();
    };
  }, [reduced, build, teardown]);

  /* Rebuilt on a WIDTH change only. A phone's address bar sliding away fires
     resize with a new height and nothing else changed; rebuilding there would
     drop every badge again mid-scroll. */
  useEffect(() => {
    if (reduced) return;
    const onResize = () => {
      const sim = simRef.current;
      if (!sim || window.innerWidth === sim.viewW) return;
      teardown();
      void build();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [reduced, build, teardown]);

  return (
    <div className="rack" ref={rackRef}>
      <svg className="rack__cords" ref={cordsRef} aria-hidden="true" focusable="false" />
      {Children.toArray(children)}
    </div>
  );
}
