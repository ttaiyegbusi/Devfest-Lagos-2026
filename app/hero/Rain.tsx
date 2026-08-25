import type { CSSProperties } from "react";

/* Drizzle.
 *
 * The first version of this was a repeating gradient masked into dashes, which
 * is a pattern rather than weather: every streak the same length, the same
 * spacing, the same speed, the whole field moving in lockstep. It read as
 * hatching over the sky, and no amount of thinning it out fixes that — the
 * problem is that there are no drops in it, only a texture.
 *
 * So these are drops, one element each, and every one of them differs: where
 * it falls, how long it is, how fast it goes, how faint it is, and how far
 * through its own fall it happens to be. Nothing is in step with anything else,
 * which is the only thing that makes falling water look like falling water.
 *
 * Drizzle rather than rain, so: short, slow, and very faint — no drop is more
 * than a quarter opaque, and most are far less. Count is the one thing that
 * cannot be stingy: each drop falls 1700px through a hero around 1000 tall, so
 * only about half are on screen at any moment, and at forty-four the sky read
 * as empty rather than as quiet. */

const COUNT = 130;

/* Seeded, so the server and the browser lay out the same sky and hydration has
   nothing to disagree about. Any fixed seed would do; this one is the golden
   ratio constant that mulberry32 is usually shown with. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(0x9e3779b9);

const DROPS = Array.from({ length: COUNT }, () => {
  const duration = 2.4 + random() * 2.6;
  return {
    left: random() * 100,
    length: 9 + random() * 11,
    opacity: 0.09 + random() * 0.17,
    duration,
    /* A negative delay starts each drop part-way down its own fall, so the
       first frame is already raining instead of a line of drops released
       together from the top. */
    delay: -random() * duration,
  };
});

export function Rain() {
  return (
    <div className="hero__rain" aria-hidden="true">
      {DROPS.map((drop, i) => (
        <span
          key={i}
          className="hero__drop"
          style={
            {
              left: `${drop.left.toFixed(2)}%`,
              height: `${drop.length.toFixed(1)}px`,
              opacity: drop.opacity.toFixed(3),
              animationDuration: `${drop.duration.toFixed(2)}s`,
              animationDelay: `${drop.delay.toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
