#!/usr/bin/env python3
"""Rebuild app/hero/HeroScene.tsx from the supplied illustration.

The Figma export is a flat, ungrouped list of <path> elements in paint order
inside one clip group. Slicing it by index is what lets the clouds and the
traffic move independently while every overlap stays exactly as the
illustrator drew it. Re-run from the repo root after replacing the source:

    python3 app/hero/generate-scene.py public/bg-new.svg
"""
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

    clouds = []
    for speed, idx in CLOUD_BANDS.items():
        shapes = "\n".join("            " + jsx(els[i]) for i in idx)
        clouds.append(
            f'        <g className="hero-scene__clouds hero-scene__clouds--{speed}">\n'
            f"          <g>\n{shapes}\n          </g>\n"
            f'          <g transform="translate(-{WIDTH} 0)">\n{shapes}\n          </g>\n'
            f"        </g>"
        )

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
{band("keke", 12)}
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
