# DevFest Lagos 2026

Hero section for the DevFest Lagos 2026 site, built against the supplied
`HERO.png` reference at **1440 × 1024**, plus the four "What to expect" panels,
the speaker wall, the FAQ and the footer.

```bash
npm install
npm run dev
npm run lint     # oxlint, currently clean
```

Environment: `NEXT_PUBLIC_SITE_URL` for absolute share-card URLs,
`SUBSCRIBE_ENDPOINT` (and optionally `SUBSCRIBE_TOKEN`) to make the footer
sign-up live. Everything works without them; the share tags point at localhost
and the sign-up says it is not connected.

Next.js 16 (App Router) · TypeScript · plain CSS · oxlint.

## Page order

Hero → What to expect (01–04) → Speakers → FAQs → Footer.

The hero and the four panels are **one pinned stack**, not five ordinary
sections. `app/stack/Stack.tsx` pins each layer while the next rises over it,
hinged at its top-left corner. 01 has to climb over the hero exactly the way 02
climbs over 01, which only works if the hero is a layer in the same stack — so
`page.tsx` hands the hero and `expectPanels()` to `<Stack>` as siblings.

## Layout

```
app/
  layout.tsx            metadata + globals
  page.tsx              section order
  globals.css           @font-face, palette tokens, gutter scale, reset
  stack/                the pinned stack every panel rides in
    Stack.tsx  Stack.css
  hero/
    Hero.tsx            hero markup (server)
    Hero.css            all hero layout + motion
    HeroNav.tsx         nav, with a disclosure menu below 900px (client)
    RotatingWord.tsx    the swapping headline word (client)
    HeroScene.tsx       GENERATED — do not hand-edit
    DevFestLogo.tsx     official icon + wordmark lockup
    generate-scene.py   rebuilds HeroScene.tsx from the source SVG
  expect/               "What to expect" — four full-bleed panels
    panels.tsx          the list handed to the stack
    Expect.tsx  Expect.css  tracks.ts
    PillPit.tsx         panel 02's topic cloud (matter-js, client)
    PaperFrame.tsx      panel 01's print, leaning away from the cursor
    assets.ts           server-side "is the photograph actually there yet?"
  speakers/             "Meet Our Speakers" — the curved wall of screens
    Speakers.tsx  Speakers.css  lineup.ts
  faq/                  category rail + accordion
    Faq.tsx  Faq.css  questions.ts
  footer/               watermark + sign-up + link columns
    SiteFooter.tsx  SiteFooter.css
scripts/
  lanes.py              solves the traffic keyframes off the drawn road
  carousel.py           solved the speaker wall's geometry
public/
  bg-new.svg            source illustration (1440 × 1024)
  fonts/                Faculty Glyphic + Geist, self-hosted (both SIL OFL)
  design/HERO.png       the visual reference
  expect/               panel photographs
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

## The two forms

Both used to be `action="#"`, which meant submitting navigated to `#`, reloaded
the page and threw the input away.

**Footer sign-up** posts to `app/api/subscribe/route.ts`, which validates the
address and forwards it. With no provider configured it answers **503 and the
footer says so** — it never reports success for an address it did not store,
because a form that says "you're subscribed" and drops the address is worse than
one that admits it is not live. To go live, set `SUBSCRIBE_ENDPOINT` (and
`SUBSCRIBE_TOKEN` if the provider needs an Authorization header); nothing else
has to change.

**Hero "Ask me anything…"** is `role="search"`, and the only body of answers on
the site is the FAQ — so submitting carries the question there as `?q=`, which
the FAQ filters on. Reading it from the URL keeps the result linkable and
survives a reload. That is an interpretation, not a spec: if "ask" is meant to
reach an assistant, `app/hero/AskForm.tsx` is the one place that changes, and
the FAQ can keep reading `q` for people arriving with a search in the URL.

## Share cards and icons

The tab icon, the iOS home-screen icon and the social share image are all
picked up by filename from `app/` — `icon.svg`, `apple-icon.png`,
`opengraph-image.png` with its `.alt.txt` alongside — so none of them are listed
in `metadata`. The icon is the official mark on the brand ink; the share card is
rendered from the real fonts, palette and illustration at 1200 × 630.

**Set `NEXT_PUBLIC_SITE_URL` at build time.** Share cards need absolute URLs and
only the deployment knows the host. Without it the tags still render, pointing
at `localhost` — fine locally, wrong in production.

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

Three loops in the hero, all disabled under `prefers-reduced-motion`.

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
about 1.2x instead of having to swell past 2.7x first.

The keyframes themselves are generated, not typed: `scripts/lanes.py` reads the
drawn road polygon and places each vehicle at a **fixed fraction across the
road** at every depth, so the lane percentage never drifts. An earlier hand-set
version wandered from 12% to 90% across the road over one loop, which is what
read as levitating.

```bash
python3 scripts/lanes.py     # prints the tables and writes the keyframes
```

The keke needs one correction on top: it is drawn larger than its position on
the road implies, so it is scaled against a deeper reference than its own wheels
suggest. Without that it swells to twice the danfo's height by the corner. Its
translate carries a small vertical term to keep the wheels down while that plays
out.

The two run the same cycle half a period apart on their own lanes, so one is
always well down the road while the other is being born at the bridge — no empty
road, no restart beat, and they no longer move like they are welded together.
Tune with `--traffic-duration` (default 12s).

**The headline word** cycles Community → Event → Place → Experience → Network →
Ecosystem. It rests on "Ecosystem", so the server render, the first paint and
the reduced-motion state are all the reference line. Words are measured on mount
and the box transitions between those widths, which is what lets the comma glide
instead of jumping. The comma stays a comma — the design's tagline runs on into
"Endless Opportunities."

The word and its comma are wrapped together in `.hero__phrase`, because the
rotator is an inline-block and that offers the line a break opportunity right
before the comma — on a 320px phone the comma dropped onto a line of its own.
Wrapped, the whole `<word>,` wraps as one unit instead.

## What to expect

Four full-bleed panels, one per track, each a layer in the pinned stack. They
share a skeleton — hairline down the middle, a heading block whose first line is
the track number, a rule, a narrow measure of copy — and differ in which side
the copy sits on and what fills the other half. That is `side` and `media` in
`tracks.ts`; below 900px each panel stacks, copy first.

**01 · Panel Sessions** is one print in a `PaperFrame`, four shots cross-fading
inside it. The frame leans away from the cursor, and its two angles are locked
at 1.75:1 rather than driven independently — that fixed ratio is what makes it
read as one sheet tilting on a diagonal hinge instead of a card being steered on
two axes.

**02 · Different talks** is the topic cloud, and the only panel with physics in
it. See below.

**03 · Workshops** is a two-by-two grid; **04 · After Party** is a band along
the bottom that loops. Two copies of the run sit end to end and the track
travels exactly one run's width, so the seam never shows. It moves at 40px/s at
every size: the component contributes `--shots`, the stylesheet contributes
`--pitch` (how wide a shot is at this breakpoint), and the lap is the two
multiplied — so photographs can be added to or dropped from `tracks.ts` freely
without the band speeding up.

Panel columns are `minmax(0, 1fr)` rather than a bare `1fr`, and that is
load-bearing. `1fr` means `minmax(auto, 1fr)`, and the `auto` minimum is the
widest thing in the column — which on 04 is a band deliberately far wider than
the page. The column sized itself to the band and laid the heading, rule and
copy out across several thousand pixels, clipped back to a phone's width by the
panel's own `overflow: hidden`. It read as a band that had stopped scrolling.

Photographs are wired up before the files land: `assets.ts` checks the path on
disk at render, so a shot that is not there yet falls back to a tinted block
rather than a broken frame, and the real picture appears the moment the file is
dropped into `public/expect/`.

They are **WebP**, at q82. They arrived as PNG — photographs in a lossless
format — weighing 3.4MB for twenty shots; the same twenty are now 319KB, 91%
off. Measured at 31–36 dB PSNR and indistinguishable at display size. Four of
them carry real transparency (panel 01's bowed print edge is drawn into the
artwork) and WebP keeps it, so don't flatten those. Nothing needed resizing —
the shots are authored at the size they are displayed, which also means they
will read soft on a 2× display until higher-resolution originals exist.

### The topic cloud

Twenty-four pills, dropped into a heap by matter-js. They stay **real DOM
elements** — selectable, searchable, crisp — and the engine only ever hands each
one a position and an angle; drawing them into a canvas would cost all of that
for nothing. Bodies are sized from what the DOM actually measured, so the
physics outline matches the rendered pill at any font size, and matter-js is
imported on demand when the panel scrolls into view so it stays out of the
initial bundle.

Six things in there are load-bearing and easy to undo by accident:

* **The fixed 60fps step.** Frame-derived stepping lets a slow frame tunnel a
  pill straight through the floor.
* **`SPIN_RESISTANCE`.** A stadium of card falling through air does not tumble
  the way a rigid bar in a vacuum does — it is damped by its own face, and
  matter models no such thing. Multiplying each body's inertia by 4 takes the
  share of pills landing past 90° from about one in eight to about one in fifty
  (measured over 144 settles per width). A label nobody can read is the one
  thing a panel whose whole job is naming topics cannot afford.
* **The generation counter.** Strict Mode mounts twice; without it the second
  mount starts a second world while the first is still awaiting its import, and
  two engines write to the same pills.
* **Hand-rolled pointer dragging** rather than matter's `MouseConstraint`, which
  binds wheel and touchmove with `preventDefault` and would stop the page
  scrolling past the panel. A pointer-down that misses every pill is left alone.
* **The pit's inset is a margin, not padding** — an absolutely positioned child
  is placed against the padding box, so padding would put the walls and the
  pills in two different coordinate frames.
* **`drag.angleB` is set on every grab.** `angleB` is the body angle that the
  grab offset is measured against, and every solve rotates that offset by the
  difference between the two. `Constraint.create` only fills it in when a body
  is attached up front, and this constraint attaches on grab — so it starts
  *undefined*, the first solve computes `body.angle - undefined`, and rotating
  the offset by that NaN poisons the body's position permanently. The pill stops
  moving and can never be picked up again. In a heap that reads as a pill that
  has simply come to rest, which is why it survived unnoticed until the pit
  started waiting for the heap to stop before going idle.
* **The resize handler only fires on a change of _width_.** A phone browser
  fires `resize` every time its address bar slides in or out, which is exactly
  what scrolling back up does, and rebuilding there dropped the whole heap again
  — several times per swipe. Nothing in the sim depends on viewport height, so a
  height-only resize is the browser's chrome moving, not the layout changing.
  (`Stack.css` handles the same hazard with `svh` instead of `vh`.)

Whether the heap has finished is asked of the picture, not of the engine: each
body is compared with where it was last frame, and half a second of no visible
movement anywhere ends the drop. matter's own sleep flags are the obvious test
and the wrong one — a single body knocked out of the simulation never sets its
flag and holds the loop open for ever, which is exactly how the `angleB` bug
above surfaced.

Once the heap is still the loop **stops** and the pit takes an `is-settled`
class. Both matter: a marketing page has no business holding a phone at 60fps to
redraw a picture that is not changing, and the class drops `will-change:
transform`, which takes each pill off its own compositor layer. On a layer the
label is rasterised once and then resampled by the rotation, which softens it;
painted in the page it is drawn at the angle it sits at, so it is sharp for the
whole time anyone is actually reading it. A grab puts both back.

The heap's box is sized to the heap: the height is estimated from the area the
pills occupy at this width, then corrected once everything has come to rest —
trimmed up if the heap sits low, opened if it pokes out of the top. At
twenty-four pills it opens on every viewport, so panel 02 is a **tall panel** and
reads in full before it pins. That is a supported case in the stack, not a bug,
but it is why 02 scrolls further than the others.

Colours are measured rather than judged by eye. Two rules hold, against the
panel's own `#fcefcb`:

| | |
|---|---|
| label against its own pill | **≥ 3:1**, so the text reads |
| pill against the panel | **≥ 15 ΔE** in CIELab, so it reads as a pill at all |

The second rule is the one that is easy to miss. "Motion Design" was a cream
chip at ΔE **4.1** from a cream panel — invisible, however good its text
contrast was (it measured 14.9:1). Nothing else in the set is under 19.

Under `prefers-reduced-motion` the cloud is laid out statically in the rows
`tracks.ts` sets by hand, and the pit is never built.

## The other sections

**Speakers** is a concave wall of screens, and the cards lie on a genuine
circle. A card `t` degrees around it sits at `(R sin t, R(1 − cos t))` and is
turned by that same `t`, so its facing and its position come from one angle —
which is what makes the row read as a single curved surface. Deriving x and z
from separate curves (a power law for the offset, a linear depth) leaves every
card facing slightly wrong for where it actually is, and the arc looks broken;
that is what this did before.

`ARC` is **18.5°** between neighbours, solved by `scripts/carousel.py` against
the reference: at that angle `cos(18.5°)` exactly cancels the size gain from
coming forward, so a card one step out projects to the same *width* as the
centre card and the gap between them survives. Radius follows from the angle and
the horizontal step — `R = step / sin(18.5°)`, giving **1112px** against a
**353px** step — and perspective is pinned at **1.429 R**. Every breakpoint
holds both that ratio and `card-w / R` at 0.281, so the wall is one shape at
every size and only its scale changes. The ring wraps, and a card is fully faded
out by the time it is carried round, so there is no seam and no card is ever
shown at a size the geometry was not solved for.

**FAQ** filters by category and opens one answer at a time. It reserves the
longest category's height so switching filters never moves the section, and
`--rows` is derived from the data rather than hardcoded. The rail becomes a
scrollable chip row below 900px.

**Footer** carries an oversized watermark: the icon mark, "Devfest" set large in
Faculty Glyphic, and "Lagos" raised above its tail. The wordmark is **type, not
the supplied lockup** — that asset runs "DevFest Lagos" along a single line in
its own lettering, which is neither the face nor the arrangement the design
asks for. Every measurement is a ratio of `--mark`, the size of "Devfest", so a
breakpoint only says how big the lockup is; the ratios were solved against the
comp at 1440 from the face's own metrics rather than nudged by eye, and the
rendered wordmark measures 609px against the comp's 610. The lockup ships in
full Google colour, so the watermark flattens it to a single grey in CSS.

The mark's path data lives in `app/hero/DevFestIcon.tsx` only — `DevFestIcon`
crops it for the watermark and `DevFestLogo` draws the same `<MarkPaths />`
inside the full lockup, so a logo change lands in one place.

## The illustration

`HeroScene.tsx` is generated. The Figma export is a flat, ungrouped list of 200
`<path>` elements in paint order; `generate-scene.py` slices it by index into
clouds (0–5), static scene (6–121), keke (122–157) and danfo (158–199) so those
bands can be transformed independently while every overlap stays exactly as
drawn. Replacing the artwork means re-deriving those ranges — the script fails
loudly on a different path count rather than silently mis-layering:

```bash
python3 app/hero/generate-scene.py public/bg-new.svg
```

At 1440 × 1024 the artwork lands 1:1. Wider viewports let its own `slice` fit
cover from the top edge. Viewports proportionally taller than 6:5 would crop the
road and traffic off the right edge, so there the artwork keeps its proportions
and sits in a band along the bottom, anchored right.
