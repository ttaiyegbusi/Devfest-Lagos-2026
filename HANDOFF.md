# DevFest Lagos 2026 — build notes

Everything below was measured or derived, not guessed. Where a number looks
oddly specific, it is because it came out of a solver — the scripts that produce
them are in `scripts/`.

---

## 1. The project

Next.js 16 (App Router) · TypeScript · plain CSS · oxlint. Conventions copied
from the earlier DevFest repos: one folder per section, a `.tsx` + `.css` pair,
data in a sibling `.ts`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

**Page order:** Hero → What to expect → Speakers → FAQs → Footer.

```
app/
  layout.tsx  page.tsx  globals.css
  hero/       Hero.tsx  Hero.css  HeroScene.tsx  DevFestLogo.tsx  generate-scene.py
  expect/     Expect.tsx  Expect.css  tracks.ts
  speakers/   Speakers.tsx  Speakers.css  lineup.ts
  faq/        Faq.tsx  Faq.css  questions.ts
  footer/     SiteFooter.tsx  SiteFooter.css
scripts/      lanes.py  carousel.py
public/       bg-new.svg  fonts/  design/HERO.png
```

---

## 2. Fonts — the part that took longest

The design file used two faces and neither was the obvious guess.

**Headline: Faculty Glyphic.** The giveaway is the diamond-shaped tittles on the
`i`. Set at **70px / 80px line-height / −2.85px letter-spacing**. The supplied
brief guessed a grotesk; it was wrong.

**UI and body: Geist — not Product Sans.** The mockup was made on a machine with
Product Sans installed, so that was the natural assumption, and it is what I
built first. It was wrong. I identified the real face by fitting per-word ink
widths *and* inter-word gaps from `HERO.png` against every font on the design
machine:

| candidate | ink RMS | gap RMS |
|---|---:|---:|
| **Geist** | **0.44px** | **0.52px** |
| Arial | 0.82 | 1.75 |
| Inter | 0.95 | 1.59 |
| Product Sans | 1.44 | 0.45 |
| Helvetica Neue | 1.05 | 2.04 |

Geist matched to under a pixel on 19 independent measurements; nothing else came
close. It is also SIL OFL, so the licensing question that Product Sans raised
disappeared. Both faces are self-hosted as woff2 in `public/fonts/`.

---

## 3. Hero calibration

Measured off `HERO.png` pixel by pixel at 1440 × 1024. Final whole-page
difference against the reference: **mean 1.43, 0.76% of pixels over threshold** —
what remains is antialiasing on the bridge cables.

| | |
|---|---|
| Nav rect | 70, 30 · 1300 × 70 · `#171717` |
| Buy Ticket | 1251, 45 · 99 × 40 |
| H1 line-box top | 250 (cap top 265; second line cap top 345) |
| Lede | Geist 24 / 30, cap top 439 |
| Ask control | 70, 533 · 347 × 60 · icon at 92, placeholder at 121 |
| Palette | bg `#FFF5D4` · ink `#171717` · accent `#F9AB00` |

---

## 4. The illustration

`HeroScene.tsx` is **generated** — do not hand-edit the path data.

The Figma export is a flat list of 200 `<path>` elements in paint order inside
one clip group. `generate-scene.py` slices it **by index** into four bands so the
clouds and traffic can move independently while every overlap stays as drawn:

| band | indices |
|---|---|
| clouds | 0–5 |
| static scene | 6–121 |
| keke | 122–157 |
| danfo | 158–199 |

```bash
python3 app/hero/generate-scene.py public/bg-new.svg
```

Replacing the artwork means re-deriving those ranges. The script fails loudly on
a different path count rather than silently mis-layering.

**Fitting.** The art is authored at exactly 1440 × 1024, so it lands 1:1 there.
Elsewhere the SVG's own `preserveAspectRatio="xMidYMin slice"` covers from the
top edge. Viewports proportionally taller than 6:5 would crop the road and
traffic off the right edge entirely, so below that ratio the artwork keeps its
proportions in a band along the bottom, anchored right.

---

## 5. Motion

All three loops are disabled under `prefers-reduced-motion`, which parks
everything at its design position — that is also the state the reference
screenshot captures, which is what makes pixel-diffing possible.

### Clouds

Three parallax bands (150s / 190s / 240s). Each band carries a duplicate of
itself one artwork-width to the left, so translating by exactly one artwork width
lands the copy where the original started. The loop has no seam by construction.

### Traffic — the long one

This went through four rewrites. The physics that matters:

> Anything standing on flat ground has an on-screen size exactly proportional to
> how far its wheels sit **below the horizon**. Here the horizon is **y = 791**,
> the line the road converges on behind the bridge.

So scale is never a hand-picked number — it falls out of the path, and the tyres
stay planted in every frame.

**What went wrong, in order:**

1. **Vehicles stopped mid-road and faded out.** A fade is a video effect; nothing
   in the world fades. Fixed by driving them off frame.
2. **The approach read as a zoom, not a drive.** The ratio of travel to growth is
   governed by one thing: how obliquely the lane crosses the view. A lane aimed
   at the camera is all growth and no travel.
3. **They levitated.** This was the real bug, and it was not the scale. A
   *straight* ray from the vanishing point does not follow this road, because the
   road curves. The danfo drifted from **12% to 90% across the road** over one
   loop — changing lanes across the entire road width, which is what read as
   floating.

**The fix:** hold a constant lane fraction. `scripts/lanes.py` reads the drawn
road polygon — near edge from its cubic, far edge from two more — and for each
depth `h` places the vehicle at a fixed fraction across the road, taking the
scale from the horizon rule.

| | danfo | keke |
|---|---:|---:|
| lane held | 0.82 | 0.70 |
| depth range | 4 → 66 | 3 → 64 |
| scale reference | /95.5 | /45 |

The keke needs one extra correction: it is **drawn larger than its position on
the road implies**, so it is scaled against a deeper reference (45) than its own
wheels suggest (26). Without that it swells to twice the danfo's height by the
corner.

Both run a 12s cycle half a period apart, so the road is never empty and they no
longer move like they are welded together. **Verified across the whole cycle at
0.5% steps: zero frames off the tarmac, zero overlaps, zero empty-road frames.**

```bash
python3 scripts/lanes.py     # prints the tables and writes the keyframes
```

Pace knob: `--traffic-duration` (default 12s).

---

## 6. Speakers carousel

A **concave** wall — cards swing their *outer* edge toward the viewer and grow as
they go out, so the row curves toward you at the ends rather than receding. I
built it convex first; measuring the reference showed the opposite.

Every constant was solved, not dialled in. The tell was that the reference's ±1
cards project to the **same width** as the centre card — which only happens when
the rotation's `cos` exactly cancels the size gain from coming forward. Feeding
the centre card, both vertical edge heights of the ±1 card, and the projected
centre offsets into `scripts/carousel.py` gives one exact solution:

| | at 1440 |
|---|---:|
| perspective | 680px |
| depth per step | 35.2px toward viewer |
| rotation per step | 18.5° |
| horizontal step | 353px × n^0.823 |

Landing on 312 / 312 / 278px projected widths with 60px and 28px gaps. Cards more
than two steps out are dropped rather than left for the perspective to blow up.

Two wrong turns worth remembering: I first read `perspective: 480px` off the
reference site's DOM and used it — it belonged to a *different* component (a
stacked mobile deck), not the wall. And 29° of rotation made the cards balloon to
1.4× and collide. The edge-height solve fixed both.

The distances live in CSS as `--step` / `--depth` / `--persp` so they scale per
breakpoint; only the offset maths is done in the component, because CSS can
neither take an absolute value nor raise to a power.

---

## 7. FAQ and Footer

**FAQ** reserves the longest category's height so switching filters never moves
the section. `--rows` is derived from the data, not hardcoded, so it stays
correct if questions are added. Verified: 1 question or 7, the list is **exactly
399px** and the section **679px**.

**Footer** sizes its watermark off the viewport so it keeps the same relationship
to the panel at every width, and the panel rides up over the bottom of the
wordmark. Two details: the official lockup ships in full Google colour, so the
watermark flattens it to one grey in CSS; and it fades top-to-bottom via a mask
so it dissolves into the section rather than stopping dead at the panel edge.

---

## 8. Verifying a change

Render at exactly 1440 × 1024 and diff against `public/design/HERO.png`.
`--force-prefers-reduced-motion` parks every animation at its design position:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --force-prefers-reduced-motion --window-size=1440,1024 --screenshot=render.png http://localhost:3000/
```

**Gotcha:** headless Chrome clamps `--window-size` below roughly 500px. Phone
widths render at the wrong viewport and look broken when they are not — check
those in a real browser instead.

---

## 9. Placeholder content

Three files carry copy standing in until the real thing exists. Each says so at
the top.

| file | what to replace |
|---|---|
| `app/speakers/lineup.ts` | The lineup. Names are literally "Speaker one" — real people were not invented. Set `image` to a file in `public/speakers/` and the tinted placeholder becomes a photo. |
| `app/faq/questions.ts` | The answers. The questions themselves come from the design. |
| `app/expect/tracks.ts` | The blurbs and bullet lists. |

---

## 10. Open items

**`.next` is committed.** 119 of the 149 tracked files are Turbopack build
output. `.gitignore` now covers it, so nothing new is staged, but those files are
already in history. Non-destructive fix: `git rm -r --cached .next` and commit.
Actually purging them needs a history rewrite — nobody has done this.

**Two sessions have been editing this repo at once.** A second session rewrote
`app/expect/` into a stacked full-bleed panel layout and added `app/stack/`. At
one point its `Expect.tsx` was mid-edit and throwing, which took down every
section below it on the page. Its commits did pick up the speakers and footer
work, so nothing was lost — but the fanned "What to expect" card layout built
earlier was replaced. Worth agreeing who owns which folders before running both.
