"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* The print behaves like a sheet held at arm's length: it leans away from the
   cursor and lifts slightly off the panel.

   The two angles are locked in a fixed ratio rather than driven independently.
   That is the detail that makes it read as one sheet tilting on a diagonal
   hinge instead of a card being steered on two separate axes — and it is what
   the reference does, where the pair sat at exactly 1.75:1 at every point in
   its travel. Only the horizontal reach is chosen here; the vertical follows. */

/** Degrees of lean at the edge of the frame. */
const REACH = 9;
/** Vertical lean as a fraction of the horizontal, from the reference. */
const RATIO = 1 / 1.75;
/** How far the sheet lifts towards the reader, px. */
const LIFT = 16;

export function PaperFrame({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const next = useRef({ rx: 0, ry: 0, lift: 0 });
  /** The frame's box while it is lying flat. */
  const rest = useRef<DOMRect | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Written on a frame rather than on the event: a pointermove can fire
    // several times between paints, and each one would otherwise force its own
    // style recalculation for a value nothing has drawn yet.
    const commit = () => {
      frame.current = 0;
      const { rx, ry, lift } = next.current;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--lift", `${lift.toFixed(1)}px`);
    };

    const schedule = () => {
      if (!frame.current) frame.current = requestAnimationFrame(commit);
    };

    const onEnter = () => {
      // Measured once, while the sheet is still flat. Reading the box on every
      // move would measure the tilt this function just applied, and the lean
      // would feed back into its own input.
      rest.current = el.getBoundingClientRect();
    };

    const onMove = (event: PointerEvent) => {
      const box = rest.current ?? el.getBoundingClientRect();
      if (!box.width || !box.height) return;

      // -1 at one edge, +1 at the other.
      const dx = ((event.clientX - box.left) / box.width) * 2 - 1;
      const dy = ((event.clientY - box.top) / box.height) * 2 - 1;

      next.current = {
        ry: Math.max(-1, Math.min(1, dx)) * REACH,
        // Negated so the sheet leans away from the cursor rather than towards
        // it, which is what selling the weight of it depends on.
        rx: -Math.max(-1, Math.min(1, dy)) * REACH * RATIO,
        lift: LIFT,
      };
      el.classList.add("frame--held");
      schedule();
    };

    const onLeave = () => {
      rest.current = null;
      next.current = { rx: 0, ry: 0, lift: 0 };
      // Dropping the class hands the return journey back to the CSS
      // transition, so the sheet settles rather than snapping flat.
      el.classList.remove("frame--held");
      schedule();
    };

    // Native rather than React's synthetic enter/leave: pointerleave does not
    // bubble, and this way the sheet is guaranteed to be let go of even when
    // the pointer is cancelled out from under it.
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <figure className={className} ref={ref}>
      {children}
    </figure>
  );
}
