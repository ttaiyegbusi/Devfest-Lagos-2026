"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// "Ecosystem" is last so the resting state — server render, first paint, and
// reduced-motion — is the word the design file draws, and the cycle returns to
// it before starting over.
const WORDS = [
  "Community",
  "Event",
  "Place",
  "Experience",
  "Network",
  "Ecosystem",
] as const;

const HOLD_MS = 2800;

export function RotatingWord() {
  const [index, setIndex] = useState(WORDS.length - 1);
  const [widths, setWidths] = useState<number[] | null>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);

  // Until the words have been measured they stay in normal flow, so the
  // pre-hydration markup is the reference line and nothing shifts on mount.
  useLayoutEffect(() => {
    let live = true;
    const measure = () => {
      if (!live) return;
      setWidths(words.current.map((el) => el?.getBoundingClientRect().width ?? 0));
    };
    measure();
    // The display face is self-hosted but may still be swapping in.
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      live = false;
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % WORDS.length),
      HOLD_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  const measured = widths !== null;

  return (
    <span
      className="hero__rotator"
      data-measured={measured || undefined}
      style={measured ? { width: `${widths[index]}px` } : undefined}
    >
      {/* Zero-width in-flow strut: once the words go absolute this is what
          keeps the inline-block sitting on the heading's baseline. */}
      <span className="hero__rotator-strut" aria-hidden="true">
        E
      </span>
      {WORDS.map((word, i) => (
        <span
          key={word}
          ref={(el) => {
            words.current[i] = el;
          }}
          className="hero__rotator-word"
          data-active={i === index || undefined}
          aria-hidden={i === index ? undefined : true}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
