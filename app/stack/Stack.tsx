"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";
import "./Stack.css";

/* Panels do not scroll past one another — each is pinned while the next rises
   over it, hinged at its top-left corner so its leading edge arrives as a
   diagonal and straightens out as it lands.

   A panel taller than the screen is read in full before it parks. It pins on
   its bottom edge rather than its top: a sticky layer given a negative `top`
   of exactly (stage - its own height) catches only once its bottom reaches the
   bottom of the screen, so everything above has already been scrolled through.
   Where a panel does fit, that height is one stage, the offset is 0, and it
   pins at the top the moment it lands — the same rule, no branch.

   The section is then that height plus one stage: the panel's own read, then
   the dwell the next panel climbs through. With every section pulled up by one
   stage, each entrance runs underneath the previous panel's pin, so three
   layers are in play at once — one leaving, one pinned, one arriving.

   Both lengths need the layer's own height, which no CSS length can reference,
   so they are written here rather than in the stylesheet. */

/** Tilt of the arriving slab while it is still a full stage away. */
const MAX_TILT = 15;

export function Stack({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const layers = Array.from(
      el.querySelectorAll<HTMLElement>(".stack__layer"),
    );
    if (layers.length === 0) return;

    // The tilt is decoration and comes off under reduced motion; the pin
    // geometry is layout, and taking it away would crop every tall panel.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    /** One panel's worth of screen, resolved from the stylesheet's --stage. */
    const stageOf = (layer: HTMLElement) =>
      parseFloat(getComputedStyle(layer).minHeight) || window.innerHeight;

    const measure = () => {
      // Read every height before writing anything back, so the writes cannot
      // invalidate a measurement still to be taken.
      const sizes = layers.map((layer) => ({
        layer,
        stage: stageOf(layer),
        height: layer.offsetHeight,
      }));

      for (const { layer, stage, height } of sizes) {
        // A panel that only rounds its way past the stage is not a tall panel;
        // without the slack it would pin a stray pixel late.
        const tall = height > stage + 1;
        layer.style.setProperty("--pin", `${tall ? stage - height : 0}px`);
        layer.parentElement?.style.setProperty(
          "--sec-h",
          `${(tall ? height : stage) + stage}px`,
        );
      }
    };

    const paint = () => {
      frame = 0;
      for (const layer of layers) {
        const slab = layer.firstElementChild;
        if (!(slab instanceof HTMLElement)) continue;

        const box = layer.getBoundingClientRect();
        const stage = stageOf(layer);

        // How much of its entrance the slab still has to travel: 1 a whole
        // stage away, 0 the moment it lands. Once it is past that — being read,
        // or pinned — this is 0 and the slab sits flat.
        const p = Math.min(1, Math.max(0, box.top / stage));

        // Quadratic, so nearly all the tilt is spent in the first third of the
        // travel and the slab reads flat well before it settles. Linear here
        // looks like a door swinging shut; this looks like it lands.
        const deg = MAX_TILT * p * p;
        const rad = (deg * Math.PI) / 180;

        // Hinged at its top-left corner, a slab swings its right edge inboard
        // and would leave a wedge of the panel behind showing. This is exactly
        // the scale that closes it, and it is back under a percent before the
        // slab is properly in view.
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

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    if (!still) paint();

    // Panel heights move when fonts land or images decode, and every length
    // above is derived from them.
    const ro = new ResizeObserver(onResize);
    for (const layer of layers) ro.observe(layer);

    if (!still) window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
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
