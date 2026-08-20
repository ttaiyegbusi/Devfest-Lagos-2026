# DevFest Lagos 2026

Hero section for the DevFest Lagos 2026 site, built against the supplied
`HERO.png` reference at **1440 × 1024**.

```bash
npm install
npm run dev
```

Next.js 16 (App Router) · TypeScript · plain CSS · oxlint.

## Page order

Hero → What to expect → Speakers → FAQs → Footer.

## Layout

```
app/
  layout.tsx            metadata + globals
  page.tsx              section order
  globals.css           @font-face, palette tokens, gutter scale, reset
  expect/               "What to expect" — the fanned track cards
    Expect.tsx  Expect.css  tracks.ts
  speakers/             "Meet Our Speakers" — the curved screen wall
    Speakers.tsx  Speakers.css  lineup.ts
  faq/                  category rail + accordion
    Faq.tsx  Faq.css  questions.ts
  footer/               watermark + sign-up + link columns
    SiteFooter.tsx  SiteFooter.css
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

## Placeholder content

Three files carry copy that is standing in until the real thing exists, and all
three say so at the top: `app/speakers/lineup.ts` (the lineup — set `image` to a
file in `public/speakers/` and the tinted placeholder card is replaced by a real
photo), `app/faq/questions.ts` (the answers; the questions themselves come from
the design), and the blurbs in `app/expect/tracks.ts`.

## Verifying the hero

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

**Traffic.** Anything standing on flat ground obeys one exact rule: its size on
screen is proportional to how far its wheels sit below the horizon. The horizon
here is 791 — the line the road converges on, behind the bridge — and the
danfo's wheels are drawn 83 units below it. So scale is not a hand-picked
number; it falls out of the path, and the tyres stay planted in every frame.

A vehicle in a straight lane images as a straight ray out of the vanishing point
at 999, 791, which is exactly what `translate(c * s) scale(s)` describes: the
translation grows in step with the scale, so each loop is one straight lane with
no swerve in it. `c` aims the lane, and it is the only real choice. The larger
it is, the more obliquely the lane crosses the view and the more ground the
vehicle covers per unit of growth — aim it at the camera and you get inflation
with no travel, aim it across the view and you get travel with no growth. These
lanes sit well towards the second, so the vehicles clear the right-hand edge at
about 1.2x instead of having to swell past 2.7x first. Sideways speed picking up
towards the end is not scripted; it is what perspective does to anything passing
you.

The keke needs one correction on top: it is drawn larger than its position on
the road implies, so it is scaled against a deeper reference (35) than its own
wheels suggest (26). Without that it swells to twice the danfo's height by the
corner. Its translate carries a small vertical term to keep the wheels down
while that plays out.

The two run the same cycle half a period apart on their own lanes, so one is
always well down the road while the other is being born at the bridge — no empty
road, no restart beat, and they no longer move like they are welded together.
Verified across the whole cycle: both stay on the tarmac at every frame (lane
fractions 0.14–0.56 and 0.33–0.66 across the road), they never overlap, and the
road is never empty. Tune with `--traffic-duration` (default 12s).

**The headline word** cycles Community → Event → Place → Experience → Network →
Ecosystem. It rests on "Ecosystem", so the server render, the first paint and
the reduced-motion state are all the reference line. Words are measured on mount
and the box transitions between those widths, which is what lets the comma glide
instead of jumping. The comma stays a comma — the design's tagline runs on into
"Endless Opportunities."

## The other sections

**What to expect** deals four cards out in a fan: they overlap by a fixed pitch
rather than sitting in a grid, and each carries its own tilt and vertical lift
from `tracks.ts`. Hovering one lifts it clear of its neighbours so the copy that
runs under the next card can be read. Below 900px the fan becomes a snap
scroller — same cards, same tilts.

**Speakers** is a concave wall of screens. The geometry was measured off the
reference rather than guessed: cards swing their *outer* edge towards the viewer
and grow as they go out (1.00x at centre, 1.10x one step out, 1.28x two), which
is why the row curves toward you at the ends instead of receding. Each card's
transform is computed in the component from its offset — `translateX(297.6 *
n^0.681)`, `translateZ(150 * n^1.3)`, `rotateY(-24deg * offset)` — because CSS
cannot take an absolute value or a power. Cards more than two steps out are
dropped rather than left for the perspective to blow up off-screen.

**FAQ** filters by category and opens one answer at a time. The rail becomes a
scrollable chip row below 900px.

**Footer** sizes its watermark off the viewport so it keeps the same
relationship to the panel at every width, and the panel rides up over the bottom
of the wordmark. The lockup ships in full Google colour, so the watermark
flattens it to a single grey in CSS.

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
