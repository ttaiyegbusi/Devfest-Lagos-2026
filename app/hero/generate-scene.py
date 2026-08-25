#!/usr/bin/env python3
"""Rebuild app/hero/HeroScene.tsx from the supplied illustration.

The Figma export is a flat, ungrouped list of <path> elements in paint order
inside one clip group. Slicing it by index is what lets the clouds and the
traffic move independently while every overlap stays exactly as the
illustrator drew it. Re-run from the repo root after replacing the source:

    python3 app/hero/generate-scene.py public/bg-new.svg
"""
import math
import re
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "public/bg-new.svg"
OUT = "app/hero/HeroScene.tsx"

WIDTH, HEIGHT = 1440, 1024
N_PATHS = 200

# Index ranges into the flat export.
BANDS = {
    "clouds": range(0, 6),     # painted behind everything
    "scene": range(6, 122),    # bridge, lagoon, stadium, road, trees
    "keke": range(122, 158),
    "bus": range(158, 200),
}
# The six cloud forms the illustrator drew, by index into the flat export.
WISP_S, WISP_L = 1, 2   # thin streaks, 104 and 186 wide
BUMPY = 0               # 375 x 217, bumpy top
LUMPY_A, LUMPY_B = 3, 4  # 439 x 255 each, different silhouettes
FLAT = 5                # 396 x 118, long and flat-bottomed

# The sky, laid out by hand.
#
# The export puts six clouds in the frame at full size — two of them 439 wide,
# a third of the screen each, and one sitting square behind the headline. At
# that scale they read as flat stickers rather than weather. Here the same six
# forms are re-used smaller and more often, which is closer to how a sky
# actually looks: many small clouds at a range of sizes, not three big ones.
#
# Each entry is (form, x, y, scale). x and y place the shape's top-left corner
# once scaled, so a cloud can be moved without its size dragging it somewhere
# else. They are measured against extent() below, which errs outwards by up to
# ~30 units on the lumpy forms — placement here is by eye against a render, so
# that slack is already accounted for.
#
# Two regions are kept clear of anything large: the headline block (x 70..1030,
# y 250..600 at the reference size) and the nav bar. Small, low-contrast clouds
# are welcome in both.
# Scattered across both axes rather than banded near the top, because the two
# sizes crop the artwork differently. At the reference width the whole 1440 is
# on screen; on a phone "slice" keeps the full height but shows only a ~470
# unit slice down the middle, and the top ~250 of that sits behind the nav bar.
# Clouds gathered along the top therefore vanish on a phone. Spread through the
# middle of the frame they read at both sizes.
#
# Nothing here avoids the headline. In daylight a cloud only lightens what is
# behind ink type, so contrast goes up rather than down; at night the clouds
# are barely above the sky. Neither costs the type anything.
SKY = {
    # Furthest: haze. Wisps only, and the least contrast of the three.
    "far": [
        (WISP_S, 60, 300, 0.75),
        (WISP_L, 210, 480, 0.70),
        (WISP_S, 400, 155, 0.90),
        (WISP_L, 545, 355, 0.65),
        (WISP_S, 760, 520, 0.85),
        (WISP_L, 940, 230, 0.72),
        (WISP_S, 1150, 430, 0.95),
        (WISP_L, 1330, 320, 0.68),
    ],
    "mid": [
        (FLAT, 120, 200, 0.44),
        (LUMPY_A, 470, 430, 0.28),
        (FLAT, 690, 120, 0.46),
        (LUMPY_B, 1000, 340, 0.30),
        (FLAT, 1280, 500, 0.42),
    ],
    # Nearest: the largest, and still around half what the export drew.
    "near": [
        (LUMPY_A, -60, 380, 0.34),
        (BUMPY, 300, 90, 0.42),
        (LUMPY_B, 620, 300, 0.36),
        (BUMPY, 960, 470, 0.38),
        (LUMPY_B, 1240, 130, 0.34),
    ],
}

# The export draws every cloud as flat white at 50% over the cream sky, which
# lands on #fffaea — one tone, the same top to bottom. That is what made these
# read as cut-out shapes: a cloud with no shaded side is a sticker.
#
# Each band gets a ramp instead, lit along the top and darker underneath, and
# the ramps carry the depth as well: atmospheric perspective says a distant
# cloud loses contrast and drifts towards the colour of the sky it sits in, so
# the far band is nearly flat and the near band has the deepest shading.
#
# The live values are in app/hero/Hero.css with the rest of the hero's colours,
# because they have to change with the light switch — the veil cannot do it for
# them. These fills are opaque, so the veil pulls cloud and sky towards itself
# at the same rate, and clouds tuned for daylight end up reading heavier at
# night than they do by day. What is written here is the daylight set, kept as
# the fallback so the sky still paints if the stylesheet ever goes missing.
#
# Depth is in the value, never in the alpha. Every fill is opaque, so a nearer
# cloud simply covers a farther one. The moment any of this moves into alpha,
# overlapping clouds start compositing and the doubled, brighter patch that
# used to plague this sky comes straight back.
CLOUD_RAMPS = {
    "far": ("#fffdf3", "#fcf4dd"),
    "mid": ("#fffefa", "#f9efd2"),
    "near": ("#ffffff", "#f3e6c6"),
}

CAMEL = {
    "fill-opacity": "fillOpacity",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-width": "strokeWidth",
    "stop-color": "stopColor",
    "clip-path": "clipPath",
    "clipPath id": "clipPath id",
}


def jsx(el: str) -> str:
    for k, v in CAMEL.items():
        el = el.replace(f' {k}="', f' {v}="')
    return el


# Path commands the extent reader below understands. A new export using arcs or
# shorthand curves must extend it rather than silently mis-measuring.
PATH_TOKEN = re.compile(r"([A-Za-z])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)")
# How many numbers each command consumes per repetition. A command may repeat
# its arguments without repeating its letter, and a run of pairs after an M is
# an implicit L, both of which the reader below has to honour.
ARITY = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6, "Z": 0}


def extent(d: str) -> tuple[float, float, float, float]:
    """Bounds of one path as (x0, y0, x1, y1), erring outwards.

    A cubic lies inside the convex hull of its control points, so the extreme
    control point already bounds the real curve. That makes this an
    over-estimate and never an under-estimate, which is the safe direction: it
    can only add a copy that was not strictly needed, never drop one that was.
    """
    tokens = PATH_TOKEN.findall(d)
    xs: list[float] = []
    ys: list[float] = []
    x = y = start_x = start_y = 0.0
    cmd = ""
    i = 0

    while i < len(tokens):
        letter, _ = tokens[i]
        if letter:
            cmd = letter
            if cmd.upper() not in ARITY:
                raise SystemExit(f"unhandled path command {cmd!r} — extend ARITY")
            i += 1
            if cmd.upper() == "Z":
                x, y = start_x, start_y
                xs.append(x)
                ys.append(y)
            continue

        if not cmd:
            raise SystemExit("path data begins with a number")

        need = ARITY[cmd.upper()]
        args = [float(tokens[i + k][1]) for k in range(need)]
        i += need
        rel = cmd.islower()
        upper = cmd.upper()

        if upper == "H":
            x = x + args[0] if rel else args[0]
        elif upper == "V":
            y = y + args[0] if rel else args[0]
        else:
            # M, L and C all finish on the last pair; C's two control points go
            # into the lists as well, and they are what bound the curve.
            for k in range(0, need, 2):
                xs.append(x + args[k] if rel else args[k])
                ys.append(y + args[k + 1] if rel else args[k + 1])
            x = x + args[-2] if rel else args[-2]
            y = y + args[-1] if rel else args[-1]
            if upper == "M":
                start_x, start_y = x, y
                # Further pairs with no letter of their own are line segments.
                cmd = "l" if rel else "L"
        xs.append(x)
        ys.append(y)

    return min(xs), min(ys), max(xs), max(ys)


def copy_offsets(extent: tuple[float, float]) -> range:
    """Which copies of a band the loop needs, as multiples of WIDTH.

    A band tiles with period WIDTH and drifts one whole period per cycle. The
    copy at k * WIDTH is on screen at some point in that cycle exactly when

        k * WIDTH + t  lies in  [-b, WIDTH - a]   for some t in [0, WIDTH]

    for shapes spanning [a, b]. Two copies — 0 and -WIDTH — are only enough
    while every shape sits inside the frame. This artwork has one cloud
    reaching to x = -246 and another to x = 1690, and a shape that crosses an
    edge needs a partner on the far side or it blinks out of existence the
    moment the loop wraps.
    """
    a, b = extent
    return range(math.ceil((-b - WIDTH) / WIDTH), math.floor((WIDTH - a) / WIDTH) + 1)


def main() -> None:
    svg = open(SRC).read()
    els = re.findall(r"<path\b[^>]*/>", svg)
    if len(els) != N_PATHS:
        raise SystemExit(
            f"expected {N_PATHS} paths, found {len(els)} — the band ranges "
            "above are index-based and must be re-derived for a new export"
        )
    defs = svg[svg.find("<defs>"):svg.find("</defs>") + 7]
    clip = re.search(r'clip-path="(url\(#[^)]+\))"', svg).group(1)

    def band(name: str, indent: int) -> str:
        pad = " " * indent
        return "\n".join(pad + jsx(els[i]) for i in BANDS[name])

    boxes = {i: extent(re.search(r' d="([^"]*)"', els[i]).group(1)) for i in range(6)}

    def placed(band: str) -> tuple[str, tuple[float, float]]:
        """One band's clouds, and how far they reach either side of the tile."""
        rows, left, right = [], [], []
        for form, x, y, scale in SKY[band]:
            x0, y0, _, _ = boxes[form]
            # Position first, then scale, so x and y mean the corner the cloud
            # lands on rather than wherever scaling happened to leave it.
            tx, ty = x - x0 * scale, y - y0 * scale
            shape = jsx(els[form])
            shape = shape.replace(' opacity="0.5"', "")
            shape = shape.replace(' fill="white"', f' fill="url(#cloud-{band})"')
            rows.append(
                f'                <g transform="translate({tx:.1f} {ty:.1f}) '
                f'scale({scale})">{shape}</g>'
            )
            left.append(x)
            right.append(x + (boxes[form][2] - x0) * scale)
        return "\n".join(rows), (min(left), max(right))

    bands, reach = {}, []
    for speed in SKY:
        markup, span = placed(speed)
        bands[speed] = markup
        reach.append(span)

    offsets = copy_offsets((min(a for a, _ in reach), max(b for _, b in reach)))

    clouds = []
    for speed in SKY:
        # Every copy is a <use>, and the group they point at lives in <defs>
        # where it does not render on its own. The alternative — letting the
        # first copy be the group itself — quietly breaks: a <use> carries the
        # referenced element's own transform and then adds its own, so putting
        # an offset on the definition shifts every copy by it as well.
        copies = "\n".join(
            f'            <use href="#sky-{speed}" transform="translate({k * WIDTH} 0)"/>'
            for k in offsets
        )
        clouds.append(
            f'          <g className="hero-scene__clouds hero-scene__clouds--{speed}">\n'
            f"{copies}\n"
            f"          </g>"
        )

    sky_defs = "\n".join(
        f'      <g id="sky-{speed}">\n{bands[speed]}\n      </g>' for speed in SKY
    )

    clouds = [
        f'        <g className="hero-scene__sky">\n'
        + "\n".join(clouds)
        + "\n        </g>"
    ]

    ramps = "\n".join(
        f'      <linearGradient id="cloud-{band}" x1="0" y1="0" x2="0" y2="1">\n'
        f'      <stop offset="0" stopColor="var(--cloud-{band}-top, {top})"/>\n'
        f'      <stop offset="1" stopColor="var(--cloud-{band}-base, {base})"/>\n'
        f"      </linearGradient>"
        for band, (top, base) in CLOUD_RAMPS.items()
    )

    defs_jsx = "\n".join("      " + jsx(l) for l in defs.splitlines())
    defs_jsx = defs_jsx.replace(
        "      </defs>", ramps + "\n" + sky_defs + "\n      </defs>"
    )

    open(OUT, "w").write(
        f'''// Generated from the supplied "BG Newww.svg" ({WIDTH} x {HEIGHT}) by
// app/hero/generate-scene.py — do not hand-edit the path data.
//
// The flat Figma export is one long list of path elements in paint order.
// It is sliced here into four bands so the drifting clouds and the traffic can
// be transformed independently while every overlap stays exactly as drawn:
// clouds sit behind the scene, the keke and the danfo in front of the road.
//
// "slice" makes the artwork behave like background-size: cover anchored to the
// top edge, so wider viewports reveal more road rather than letterboxing, and
// the surplus bleeds off the bottom the way the design file crops it.
export function HeroScene() {{
  return (
    <svg
      className="hero-scene"
      viewBox="0 0 {WIDTH} {HEIGHT}"
      preserveAspectRatio="xMidYMin slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
{defs_jsx}
      <g clipPath="{clip}">
{chr(10).join(clouds)}
        <g className="hero-scene__static">
{band("scene", 10)}
        </g>
        <g className="hero-scene__traffic">
          <g className="hero-scene__keke">
            <g className="hero-scene__keke-body">
{band("keke", 14)}
            </g>
          </g>
          <g className="hero-scene__bus">
{band("bus", 12)}
          </g>
        </g>
      </g>
    </svg>
  );
}}
'''
    )
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
