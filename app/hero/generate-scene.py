#!/usr/bin/env python3
"""Rebuild app/hero/HeroScene.tsx from the supplied illustration.

The Figma export is a flat, ungrouped list of 203 <path> elements in paint
order. Slicing it by index is what lets the clouds and the traffic move
independently while every overlap stays exactly as the illustrator drew it.
Re-run from the repo root after replacing the source SVG:

    python3 app/hero/generate-scene.py path/to/BG\\ New.svg
"""
import re
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "public/bg-new.svg"
OUT = "app/hero/HeroScene.tsx"

# Index ranges into the flat export.
BANDS = {
    "clouds": range(0, 6),     # painted behind everything
    "scene": range(6, 125),    # bridge, lagoon, stadium, road, trees
    "keke": range(125, 161),
    "bus": range(161, 203),
}
# Cloud indices grouped into parallax bands, slowest (most distant) first.
CLOUD_BANDS = {"far": [1, 2], "mid": [3, 5], "near": [0, 4]}

CAMEL = {
    "fill-opacity": "fillOpacity",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-width": "strokeWidth",
    "stop-color": "stopColor",
}


def jsx(el: str) -> str:
    for k, v in CAMEL.items():
        el = el.replace(f' {k}="', f' {v}="')
    return el


def main() -> None:
    svg = open(SRC).read()
    els = re.findall(r"<path\b[^>]*/>", svg)
    if len(els) != 203:
        raise SystemExit(
            f"expected 203 paths, found {len(els)} — the band ranges above "
            "are index-based and must be re-derived for a new export"
        )
    defs = svg[svg.find("<defs>"):svg.find("</defs>") + 7]

    def band(name: str, indent: int) -> str:
        pad = " " * indent
        return "\n".join(pad + jsx(els[i]) for i in BANDS[name])

    clouds = []
    for speed, idx in CLOUD_BANDS.items():
        shapes = "\n".join("          " + jsx(els[i]) for i in idx)
        clouds.append(
            f'      <g className="hero-scene__clouds hero-scene__clouds--{speed}">\n'
            f"        <g>\n{shapes}\n        </g>\n"
            f'        <g transform="translate(-1937 0)">\n{shapes}\n        </g>\n'
            f"      </g>"
        )

    defs_jsx = "\n".join("      " + jsx(l) for l in defs.splitlines())

    open(OUT, "w").write(
        f'''// Generated from the supplied "BG New.svg" (intrinsic 1937 x 1154) by
// app/hero/generate-scene.py — do not hand-edit the path data.
//
// The flat Figma export is one long list of path elements in paint order.
// It is sliced here into four bands so the drifting clouds and the traffic can
// be transformed independently while every overlap stays exactly as drawn:
// clouds sit behind the scene, the keke and the danfo in front of the road.
export function HeroScene() {{
  return (
    <svg
      className="hero-scene"
      width="1937"
      height="1154"
      viewBox="0 0 1937 1154"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
{defs_jsx}
{chr(10).join(clouds)}
      <g className="hero-scene__static">
{band("scene", 8)}
      </g>
      <g className="hero-scene__traffic">
        <g className="hero-scene__keke">
{band("keke", 10)}
        </g>
        <g className="hero-scene__bus">
{band("bus", 10)}
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
