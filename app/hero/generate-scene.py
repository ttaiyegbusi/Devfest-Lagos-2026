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
# Cloud indices grouped into parallax bands, slowest (most distant) first.
CLOUD_BANDS = {"far": [1, 2], "mid": [3, 5], "near": [0, 4]}

# Every cloud in the export is drawn as white at this opacity. It is lifted off
# the individual shapes and onto the group that holds all three parallax bands,
# because the bands travel at different speeds and therefore slide over each
# other. Two 50% whites stacked composite to 75%, so an overlap used to paint a
# brighter patch with a hard seam through it — a third tone that exists nowhere
# in the artwork. Held on the group, overlapping clouds merge into one
# silhouette instead, and a cloud with nothing behind it renders exactly as it
# did before.
CLOUD_OPACITY = "0.5"

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


def x_extent(d: str) -> tuple[float, float]:
    """Horizontal bounds of one path, erring outwards.

    A cubic lies inside the convex hull of its control points, so the extreme
    control x already bounds the real curve. That makes this an over-estimate
    and never an under-estimate, which is the safe direction: it can only add a
    copy that was not strictly needed, never drop one that was.
    """
    tokens = PATH_TOKEN.findall(d)
    xs: list[float] = []
    x = start = 0.0
    cmd = ""
    args: list[float] = []
    i = 0

    while i < len(tokens):
        letter, number = tokens[i]
        if letter:
            cmd = letter
            if cmd.upper() not in ARITY:
                raise SystemExit(f"unhandled path command {cmd!r} — extend ARITY")
            i += 1
            if cmd.upper() == "Z":
                x = start
                xs.append(x)
            continue

        if not cmd:
            raise SystemExit("path data begins with a number")

        need = ARITY[cmd.upper()]
        args = [float(tokens[i + k][1]) for k in range(need)]
        i += need
        rel = cmd.islower()
        upper = cmd.upper()

        if upper == "V":
            pass
        elif upper == "H":
            x = x + args[0] if rel else args[0]
        else:
            # M, L and C all finish on the last pair; C's two control points go
            # into xs as well, and they are what bound the curve.
            for k in range(0, need, 2):
                xs.append(x + args[k] if rel else args[k])
            x = x + args[-2] if rel else args[-2]
            if upper == "M":
                start = x
                # Further pairs with no letter of their own are line segments.
                cmd = "l" if rel else "L"
        xs.append(x)

    return min(xs), max(xs)


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

    spans = [x_extent(re.search(r' d="([^"]*)"', els[i]).group(1))
             for idx in CLOUD_BANDS.values() for i in idx]
    offsets = copy_offsets((min(a for a, _ in spans), max(b for _, b in spans)))

    clouds = []
    for speed, idx in CLOUD_BANDS.items():
        shapes = "\n".join(
            "              " + jsx(els[i]).replace(f' opacity="{CLOUD_OPACITY}"', "")
            for i in idx
        )
        copies = "\n".join(
            f'            <g transform="translate({k * WIDTH} 0)">\n{shapes}\n            </g>'
            for k in offsets
        )
        clouds.append(
            f'          <g className="hero-scene__clouds hero-scene__clouds--{speed}">\n'
            f"{copies}\n"
            f"          </g>"
        )

    clouds = [
        f'        <g className="hero-scene__sky" opacity="{CLOUD_OPACITY}">\n'
        + "\n".join(clouds)
        + "\n        </g>"
    ]

    defs_jsx = "\n".join("      " + jsx(l) for l in defs.splitlines())

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
