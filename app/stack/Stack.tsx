"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";
import "./Stack.css";

/* Panels do not scroll past one another — each one is pinned while the next
   rises over it, hinged at its top-left corner so its leading edge arrives as
   a diagonal and straightens out as it lands.

   The layout is all CSS: a section twice the stage height with a sticky layer
   one stage tall pins for exactly one stage, and the -1 stage margin on every
   section after the first slides the next one's entrance under the previous
   one's pin. So at any moment three layers are in play — one leaving, one
   pinned, one arriving.

   The only thing measured per frame is the tilt, below. */

/** Tilt of the arriving slab while it is still a full stage away. */
const MAX_TILT = 15;

export function Stack({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(
      el.querySelectorAll<HTMLElement>(".stack__layer"),
    );
    let frame = 0;

    const paint = () => {
      frame = 0;
      const stage = window.innerHeight;

      for (const layer of layers) {
        const slab = layer.firstElementChild;
        if (!(slab instanceof HTMLElement)) continue;

        const box = layer.getBoundingClientRect();

        // How much of its entrance the slab still has to travel: 1 a whole
        // stage away, 0 the moment it lands.
        const p = Math.min(1, Math.max(0, box.top / stage));

        // Quadratic, so nearly all of the tilt is spent in the first third of
        // the travel and the slab reads flat well before it settles. Linear
        // here looks like a door swinging shut; this looks like it lands.
        const deg = MAX_TILT * p * p;
        const rad = (deg * Math.PI) / 180;

        // Hinged at the top-left corner, a slab swings its right edge inboard
        // and would leave a wedge of the panel behind showing. This is exactly
        // the scale that closes it — and since the tilt decays quadratically,
        // it is back under a percent before the slab is properly in view.
        const cover =
          box.width > 0
            ? Math.cos(rad) + (box.height / box.width) * Math.sin(rad)
            : 1;

        slab.style.setProperty("--rot", `${deg.toFixed(3)}deg`);
        slab.style.setProperty("--cover", cover.toFixed(4));
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="stack" ref={root}>
      {Children.map(children, (child) => (
        <div className="stack__sec">
          <div className="stack__layer">
            <div className="stack__slab">{child}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
