# DevFest Lagos 2026

Hero section for the DevFest Lagos 2026 site, built against the supplied
`HERO.png` reference at **1440 × 1024**.

```bash
npm install
npm run dev
```

Next.js 16 (App Router) · TypeScript · plain CSS · oxlint.

## Layout

```
app/
  layout.tsx            metadata + globals
  page.tsx
  globals.css           @font-face, palette tokens, gutter scale, reset
  hero/
    Hero.tsx            hero markup (server)
    Hero.css            all hero layout + motion
    HeroNav.tsx         nav, with a disclosure menu below 900px (client)
    RotatingWord.tsx    the swapping headline word (client)
    HeroScene.tsx       GENERATED — do not hand-edit
    DevFestLogo.tsx     official icon + wordmark lockup
    generate-scene.py   rebuilds HeroScene.tsx from the source SVG
public/
  bg-new.svg            source illustration (1440 × 1024)
  fonts/                Faculty Glyphic + Geist, self-hosted (both SIL OFL)
  design/HERO.png       the visual reference
```

## Calibration

These values were measured off `HERO.png` pixel by pixel, not guessed. Changing
them moves the design away from the reference.

| | |
|---|---|
| Nav rect | 70, 30 · 1300 × 70 · `#171717` |
| Buy Ticket | 1251, 45 · 99 × 40 |
| H1 | Faculty Glyphic **69–70px / 80px, letter-spacing −2.85px** |
| H1 line box top | 250 (cap top 265, second line 345) |
| Lede | Geist **24px / 30px**, cap top 439 |
| Ask control | 70, 533 · 347 × 60 · icon at 92, placeholder at 121 |
| Background | `#FFF5D4` · accent `#F9AB00` |

The heading face is Faculty Glyphic (the diamond tittles on the `i` are the
giveaway) and the UI face is Geist — identified by fitting per-word ink widths
and inter-word gaps from the reference against every font on the design
machine; Geist matched to under a pixel, Product Sans and Inter did not.

Verify a change by rendering at exactly 1440 × 1024 and diffing against
`public/design/HERO.png`. `--force-prefers-reduced-motion` parks every
animation at its design position, which is the state the reference captures:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --force-prefers-reduced-motion --window-size=1440,1024 --screenshot=render.png http://localhost:3000/
```

Headless Chrome clamps `--window-size` below roughly 500px, so check phone
widths in a real browser rather than from that screenshot.

## Motion

Three loops, all disabled under `prefers-reduced-motion`.

**Clouds** drift right in three parallax bands (150s / 190s / 240s). Each band
carries a duplicate of itself one artwork-width to the left, so translating by
exactly one artwork width lands the copy where the original started — the loop
has no seam.

**Traffic** is one transform on both vehicles, because they share one road. The
road converges on **999, 791** in artwork coordinates, where its near edge meets
its far edge behind the bridge. Scaling about that single point *is* perspective
travel: every part of the danfo and the keke slides along its own ray from the
vanishing point, so roofs rise, wheels drop, and they stay on the tarmac all the
way down. Scale steps trace `1/(a − bt)` — constant speed on the road, which on
screen reads as acceleration towards the camera. They enter already a good way
down the road rather than as specks at the vanishing point, so the whole
approach covers ground instead of growing in place. Past the design position
(75% of the cycle) the road bends towards the bottom-right corner, so the last
stretch adds a translation on top of the scale and they carry on out of frame
rather than stopping. Tune with `--traffic-duration` (default 14s).

**The headline word** cycles Community → Event → Place → Experience → Network →
Ecosystem. It rests on "Ecosystem", so the server render, the first paint and
the reduced-motion state are all the reference line. Words are measured on mount
and the box transitions between those widths, which is what lets the comma glide
instead of jumping. The comma stays a comma — the design's tagline runs on into
"Endless Opportunities."

## The illustration

`HeroScene.tsx` is generated. The Figma export is a flat, ungrouped list of 200
`<path>` elements in paint order; `generate-scene.py` slices it by index into
clouds (0–5), static scene (6–121), keke (122–157) and danfo (158–199) so those
bands can be transformed independently while every overlap stays exactly as
drawn. Replacing the artwork means re-deriving those ranges:

```bash
python3 app/hero/generate-scene.py public/bg-new.svg
```

At 1440 × 1024 the artwork lands 1:1. Wider viewports let its own `slice` fit
cover from the top edge. Viewports proportionally taller than 6:5 would crop the
road and traffic off the right edge, so there the artwork keeps its proportions
and sits in a band along the bottom, anchored right.
