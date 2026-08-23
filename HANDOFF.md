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
npm run lint     # oxlint — clean, keep it that way
```

**Page order:** Hero → What to expect (01–04) → Speakers → FAQs → Footer.

The hero and the four panels are **one pinned stack**, not five ordinary
sections. 01 has to rise over the hero exactly the way 02 rises over 01, and it
can only do that if the hero is a layer in the same stack — so `page.tsx` hands
the hero and `expectPanels()` to `<Stack>` as siblings.

```
app/
  layout.tsx  page.tsx  globals.css
  stack/      Stack.tsx  Stack.css
  hero/       Hero.tsx  Hero.css  HeroNav.tsx  RotatingWord.tsx
              HeroScene.tsx  DevFestLogo.tsx  generate-scene.py
  expect/     panels.tsx  Expect.tsx  Expect.css  tracks.ts
              PillPit.tsx  PaperFrame.tsx  assets.ts
  speakers/   Speakers.tsx  Speakers.css  lineup.ts
  faq/        Faq.tsx  Faq.css  questions.ts
  footer/     SiteFooter.tsx  SiteFooter.css
scripts/      lanes.py  carousel.py
public/       bg-new.svg  fonts/  design/HERO.png  expect/
```

`panels.tsx` exists only so that `expectPanels` — which returns a *list*, not a
component — is not exported from the same file as one. A file that exports both
opts out of fast refresh for everything in it, which is what oxlint's
`only-export-components` is pointing at.

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

Those are the desktop numbers and they are the reference's. The disclosure menu
below 900px is not in the reference, so it is sized for thumbs rather than
measured: its links were 24px tall and only as wide as their own labels — "FAQ"
was a target 26px across in a menu 280px wide — which is WCAG 2.5.8 AA's floor
exactly, with nothing spare. They are now full-width 44px rows, with a 44px
toggle and a full-width 48px Buy Ticket. Verified pixel-identical on desktop:
nav band, headline, lede and ask control all diff to zero against the previous
render at 1440 x 1024.

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

### The placement is a circle, and that matters

The cards lie on a real circle. A card `t` degrees around it sits at
`(R sin t, R(1 − cos t))` and is turned by **that same t**, so its facing and its
position come from one angle. That is the whole definition of lying on an arc,
and it is what makes the row read as a single curved surface.

This is the second model. The first derived `x` and `z` from *separate* curves —
a power law for the horizontal offset, a linear depth per step — which leaves
every card facing slightly wrong for where it actually is. Each card looks fine
alone and the row looks broken. If you are tempted to reintroduce an exponent,
this is what it costs.

`ARC` is **18.5°** between neighbours, kept from the original reference solve.
Radius follows from that angle and the horizontal step, and perspective is pinned
at a fixed multiple of the radius:

| | 1440+ | ≤1023 | ≤767 |
|---|---:|---:|---:|
| `--card-w` | 312px | 262px | 208px |
| `--step` | 353px | 296px | 235px |
| `--arc-r` = step / sin 18.5° | 1112px | 933px | 741px |
| `--persp` = 1.429 R | 1589px | 1333px | 1059px |

Every breakpoint holds both `persp / R` at 1.429 and `card-w / R` at 0.281, so
the wall is **one shape** at every size and only its scale changes. Check those
two ratios after touching any of these numbers; nothing else is a free choice.

The number to hold is not the scale at a card's centre but at its **near edge**:
a card two steps out is turned 37°, which pulls that edge `(card-w / 2) sin 37°`
further forward than its middle, and the near edge is what sets how tall the card
stands. At 1.429 R it reaches exactly **1.25×** there — enough to read as an arc
coming towards you, little enough that it still sits inside the section.

Projected widths come out at **312 / 307 / 290px** going out from the centre: near
enough constant one step out, which is what the reference shows, because
`cos(18.5°)` very nearly cancels the size gain from coming forward. Cards more
than two steps out are dropped rather than left for the perspective to blow up —
and since the ring wraps and a card has faded out entirely by the time it is
carried round, the row is endless with no seam and never shows a card at a size
the geometry was not solved for.

Only the trigonometry is done in the component, because CSS can take neither a
sine nor a cosine; the radius lives in the stylesheet as `--arc-r` so the arc
scales with the card at each breakpoint.

**`scripts/carousel.py` is stale.** It still solves the superseded model and
prints `--persp` / `--depth` / `--step` / `exponent`, of which only the step and
the 18.5° rotation survived into the code — there is no `--depth` and no exponent
any more. It is kept because it is where the 18.5° came from, and because its
four input measurements are the record of what was actually read off the
reference. Do not paste its output into the CSS.

Two wrong turns worth remembering: I first read `perspective: 480px` off the
reference site's DOM and used it — it belonged to a *different* component (a
stacked mobile deck), not the wall. And 29° of rotation made the cards balloon to
1.4× and collide. The edge-height solve fixed both.

---

## 7. What to expect — the panels

Four full-bleed panels, one per track, each a layer in the pinned stack. They
share a skeleton — hairline down the middle, a heading block whose first line is
the track number, a rule, a narrow measure of copy — and differ only in which
side the copy sits on and what fills the other half. That is `side` and `media`
in `tracks.ts`. Below 900px each panel stacks, copy first.

**01** is one print in a `PaperFrame` with four shots cross-fading inside it. The
frame leans away from the cursor, and its two angles are locked at **1.75:1**
rather than driven independently — that fixed ratio, taken from the reference, is
what makes it read as one sheet tilting on a diagonal hinge instead of a card
being steered on two axes. **02** is the topic cloud, below. **03** is a
two-by-two grid; **04** is a band along the bottom that loops, so photographs can
be added or dropped in `tracks.ts` without the travel speed changing.

`assets.ts` checks each shot's path on disk at render, server-side, so a
photograph that has not landed yet falls back to a tinted block rather than a
broken frame — and the real picture appears the moment the file is dropped into
`public/expect/`.

### Every panel column is `minmax(0, 1fr)`, and it has to be

A bare `1fr` is `minmax(auto, 1fr)`, and that `auto` minimum is the widest thing
in the column. On 04 that is a photo band built to be several thousand pixels
wide — so the column sized itself to the band, and the heading, the rule and the
copy were laid out across all of it and clipped back to a phone's width by the
panel's `overflow: hidden`.

What it looked like was the band having stopped: three photographs, no movement,
everything else running off the right-hand edge. What had actually happened is
that the whole panel had been stretched out underneath it. Desktop escaped only
by accident — there 04's band spans *both* columns, and a spanning item's
contribution is not applied to flexible tracks, so nothing inflated. Stacked,
there is one column and no second one to absorb it.

Both the desktop and the stacked rules now use `minmax(0, 1fr)`. Verified: 04's
media column is 350px at 390 wide (it was 4062), desktop is unchanged at 676px
for 01–03 and 1352 for 04, and no breakpoint scrolls the document sideways.

### The headline's comma

`.hero__phrase` wraps the rotating word and the comma after it. Without it the
rotator — an inline-block — offers the line a break opportunity immediately
before the comma, and at 320px the comma took it and sat alone on a line while
the heading overflowed its box by 25px. Wrapped, `One` breaks away and the whole
`<word>,` moves down together. Nothing overflows at 320 now, and the rag reads
One / Ecosystem, / Endless / Opportunities.

The threshold was about 355px: the widest word is "Community" at 218px, and
`One ` + that + the comma needs ~317px against the 320px available at a 360px
viewport. Three pixels of headroom, so it was always going to break somewhere.

### The band's lap is worked out in CSS

The band travels at **40px/s** and must do so at every size: adding photographs
lengthens the lap rather than speeding the band up. That needs the count and the
shot pitch, and only one of them is known in each place — the component knows how
many shots there are, the stylesheet knows how wide a shot is at this breakpoint.
So the component sets `--shots` and the stylesheet holds `--pitch` (6s per shot
at 240px of pitch, 4.25s at 170px below 768), and the lap is the two multiplied.

Before this the pitch was hard-coded to the desktop figure in the component, so
the phone — where shots are 150px, not 220px — ran its lap at **28px/s**. On top
of the column bug that is the other half of why the band read as stopped.

### The pill pit

The topic cloud is a matter-js drop, ported from `app/talks/TalksSection.tsx` in
the *New DevFest Lagos 2026 Website* repo. `app/expect/PillPit.tsx`.

The pills stay **real DOM elements** — selectable, searchable, crisp — and the
engine only ever hands each one a position and an angle; drawing them into a
canvas would cost all of that for nothing. Bodies are sized from what the DOM
actually measured, so the physics outline matches the rendered pill at any font
size. matter-js is imported on demand when the panel scrolls into view, so it
stays out of the initial bundle.

Six things in there are load-bearing and easy to undo by accident:

* **The fixed 60fps step.** Frame-derived stepping lets a slow frame tunnel a
  pill straight through the floor.
* **`SPIN_RESISTANCE`.** Every body's inertia is multiplied by 4 after it is
  built. A stadium of card falling through air is damped by its own face and
  does not tumble like a rigid bar in a vacuum; matter models no such thing, so
  pills landed past 90° and their labels read upside down. Measured over 144
  settles per width: about one in eight before, one in fifty after — and the
  lighter fall had already halved it from the constants before that. It is not
  zero, and it should not be: a heap where every card lands face-up looks
  staged. If zero is ever wanted, a stadium has 180° rotational symmetry, so a
  settled pill past 90° could be *rendered* at `angle + PI` with its physics
  outline unchanged.
* **The generation counter.** Strict Mode mounts twice; without it the second
  mount starts a second world while the first is still awaiting its import, and
  two engines write to the same pills.
* **Hand-rolled pointer dragging** rather than matter's `MouseConstraint`, which
  binds wheel and touchmove with `preventDefault` and would stop the page
  scrolling past the panel. A pointer-down that misses every pill is left alone.
* **`drag.angleB` is set on every grab.** See below — this one cost a day.
* **The resize handler only fires on a change of _width_.** A phone browser fires
  `resize` every time its address bar slides in or out, which is exactly what
  scrolling back up does, and the pit used to rebuild on any resize at all — so
  the whole heap fell again, several times per swipe up. Nothing in the sim
  depends on viewport height. (`Stack.css` meets the same hazard and answers it
  with `svh` rather than `vh`; same bug, same page, two different layers.)
* **Stillness is measured off the picture, not off matter's sleep flags.** Each
  body is compared with where it was last frame, and half a second with nothing
  moving anywhere ends the drop. `bodies.every(b => b.isSleeping)` is the obvious
  test and the wrong one: one body knocked out of the simulation never sets its
  flag and holds the loop open for ever. A body with a bad position also fails
  the "did it move?" test, so it counts as still rather than blocking.

The pit's inset is a **margin, not padding** — an absolutely positioned child is
placed against the padding box, so padding would put the walls and the pills in
two different coordinate frames.

Reduced motion gets the cloud laid out statically in the hand-set rows, and the
pit is never built.

### The drag bug, because it will look like something else

Dragging a pill killed it. Not visibly: the pill froze exactly where it stood,
which in a heap of settled pills is indistinguishable from a pill that has come
to rest. It could never be picked up again. **Six drags out of six killed one.**

`angleB` is the body angle a constraint's attachment point is measured against,
and every solve rotates that point by the difference between the two.
`Constraint.create` only fills it in when a body is attached *up front* — and a
drag constraint attaches on grab. So it stayed `undefined`, the first solve after
a grab worked out `body.angle - undefined`, and rotating the offset by that NaN
put the body's position permanently beyond recovery.

Two things kept it hidden. An invalid transform string is silently rejected by
the CSS parser, so the element keeps its last good value and the pill simply
stops — it never jumps to a corner the way a NaN usually announces itself. And
the render loop used to run for ever regardless, so nothing was ever waiting on
the heap to finish. It only surfaced once the loop started stopping.

If a pill ever goes inert again, check `sim.drag.angleB` first.

### Settling, and why the loop stops

Once the heap is still the loop **stops** and the pit takes an `is-settled` class.
Both halves matter. A marketing page has no business holding a phone at 60fps to
redraw a picture that is not changing; and the class drops `will-change:
transform`, which takes each pill off its own compositor layer. On a layer the
label is rasterised once and then *resampled* by the rotation, which is what
softened the type; painted in the page it is drawn at the angle it sits at.
Offsets snap to whole pixels at the same moment, so the glyphs land back on the
grid they were hinted for. A grab puts all of it back.

### Colours are measured

Two rules, both against the panel's own `#fcefcb`, and both written into
`tracks.ts` so the next topic added is checked rather than guessed:

| | |
|---|---|
| label against its own pill | **≥ 3:1**, so the text reads |
| pill against the panel | **≥ 15 ΔE** in CIELab, so it reads as a pill at all |

The second is the one that is easy to miss, and it is the one that failed.
"Motion Design" was a cream chip at **4.1 ΔE** from a cream panel — invisible,
while measuring a perfectly respectable **14.9:1** on text contrast. Nothing else
in the set is under 19 ΔE. WCAG alone would have passed it.

The cloud is now **twenty-four** pills; eight were added beyond the design's
sixteen and `tracks.ts` names them. That heap is taller than `MAX_VH` was ever
meant to allow — see §11.

---

## 8. FAQ and Footer

**FAQ** reserves the longest category's height so switching filters never moves
the section. `--rows` is derived from the data, not hardcoded, so it stays
correct if questions are added. Verified: 1 question or 7, the list is **exactly
399px** and the section **679px**.

**Footer.** The watermark is the mark plus a wordmark **set as type**, not the
supplied lockup. The lockup runs "DevFest Lagos" along one line in its own
lettering; the comp sets it in Faculty Glyphic and lifts "Lagos" above the tail
of "Devfest", which is not an arrangement a single-line asset can be bent into.
It was built from the lockup at first, and that was wrong on both counts — wrong
face, and "Lagos" inline instead of raised.

Everything is a ratio of `--mark`, the size of "Devfest", so a breakpoint only
says how big the lockup is. The ratios were solved against the comp at 1440
using the face's own metrics rather than nudged by eye — canvas `measureText` at
100px gives "Devfest" 362.5 wide, cap ascent 80, line box 104 up / 26 down:

| | |
|---|---:|
| `--mark` at 1440 | 168px — "Devfest" 610px wide in the comp |
| icon width | 1.795 × `--mark` |
| gap, icon to wordmark | 0.267 × |
| "Lagos" size | 0.352 × |
| "Lagos" right offset | 0.178 × |
| "Lagos" bottom offset | 0.871 × |

That last one is the only non-obvious number: "Lagos" sits with its baseline on
"Devfest"'s cap line, which is the cap ascent (0.80em) plus the difference
between where the two line boxes' bottoms fall. All six are written as `calc()`
off `--mark` rather than in `em`, because an `em` inside `.foot__city` would
resolve against its own smaller size and quietly halve every offset.

Rendered "Devfest" measures 609px against the comp's 610.

No tracking on the wordmark: the size was solved from the face's natural widths,
and any letter-spacing puts it off the comp again. No fade mask either — the
comp has it flat, and the panel simply starts below the letters rather than
riding up over them. The lockup ships in full Google colour, so the watermark
still flattens it to one grey in CSS.

The mark's four paths live in `app/hero/DevFestIcon.tsx` and nowhere else:
`DevFestIcon` draws them cropped for the watermark, and `DevFestLogo` draws the
same `<MarkPaths />` inside the full lockup's viewBox, so a change to the mark
has one place to land instead of two that can drift. Verified: the nav lockup is
pixel-identical after that extraction.

---

## 9. Verifying a change

Render at exactly 1440 × 1024 and diff against `public/design/HERO.png`.
`--force-prefers-reduced-motion` parks every animation at its design position:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --force-prefers-reduced-motion --window-size=1440,1024 --screenshot=render.png http://localhost:3000/
```

**Gotcha:** headless Chrome clamps `--window-size` below roughly 500px. Phone
widths render at the wrong viewport and look broken when they are not — check
those in a real browser instead.

---

## 10. Placeholder content

Three files carry copy standing in until the real thing exists. Each says so at
the top.

| file | what to replace |
|---|---|
| `app/speakers/lineup.ts` | The lineup. Names are literally "Speaker one" — real people were not invented. Set `image` to a file in `public/speakers/` and the tinted placeholder becomes a photo. |
| `app/faq/questions.ts` | The answers. The questions themselves come from the design. |
| `app/expect/tracks.ts` | The blurbs and bullet lists. |

---

## 11. Open items

**`.next` is committed.** 118 of the 184 tracked files are Turbopack build
output. `.gitignore` now covers it, so nothing new is staged, but those files are
already in history. Non-destructive fix: `git rm -r --cached .next` and commit.
Actually purging them needs a history rewrite — nobody has done this.

**The stacked panels won, and the docs now say so.** Two sessions were editing
this repo at once; the second rewrote `app/expect/` from the fanned card layout
into stacked full-bleed panels and added `app/stack/`. That is the layout that
shipped, and both this file and the README describe it. The fan is gone; do not
go looking for it. (The hazard itself stands: agree who owns which folders before
running two sessions again.)

**`scripts/carousel.py` solves a model the code no longer uses.** Kept for the
18.5° and for the record of what was measured off the reference — see §6. Its
`--depth` and exponent outputs have nowhere to go.

**Panel 02 is a tall panel.** At twenty-four pills the heap outgrows `MAX_VH` on
every viewport tested (930px in a 1024-high window, 801px in an 800). The trim
reopens the box rather than cut the top row off, so the panel reads in full
before it pins — a supported case in the stack, but it means 02 scrolls further
than 01, 03 and 04 do. `MAX_VH` now only bounds the opening *estimate*, and its
comment says so. Cutting a few topics would bring it back inside one screen if
that is preferred.
