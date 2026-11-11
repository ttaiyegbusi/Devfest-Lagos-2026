#!/usr/bin/env python3
"""Cut a panel photograph from an original, at 1x and 2x together.

This is the other half of scripts/reshoot.py. `reshoot` re-cuts a shot that
already exists, finding the framing it was given once before; this one takes a
framing that has not been chosen yet, for a photograph arriving for the first
time.

    python3 scripts/cutshot.py <original> <name> <left> <top> <width>

`name` is the shot's name without a suffix, e.g. `workshops-3`. The height
follows from the width — every shot in a group shares one frame, and a crop
that drifts off it would be letterboxed or stretched by the grid rather than
politely accommodated. Both files are written at once, because a 1x without
its 2x is the soft picture this was all meant to fix, and a 2x without its 1x
is a file no browser will ask for.

Pass `--frame panel` for panel 01's taller 492x567 frame; the default is the
220x249 the strip, the grid and the after-party band share.

Crops are recorded in HANDOFF.md as they are chosen, so a shot can be cut
again — at 3x, or after a re-edit of the original — without anyone having to
guess at the framing a second time.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "public" / "expect"

# The two frames in use, as (width, height) at 1x. See HANDOFF.
FRAMES = {"grid": (220, 249), "panel": (492, 567)}

# Matching the twenty files already in public/expect. A srcset pair the
# browser may pick either half of must not be two differently-encoded
# pictures.
WEBP = dict(quality=82, method=6)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("original", type=Path)
    ap.add_argument("name", help="shot name without suffix, e.g. workshops-3")
    ap.add_argument("left", type=int)
    ap.add_argument("top", type=int)
    ap.add_argument("width", type=int, help="crop width in the original's pixels")
    ap.add_argument("--frame", choices=sorted(FRAMES), default="grid")
    ap.add_argument("--scale", type=int, default=2)
    args = ap.parse_args()

    if not args.original.is_file():
        print(f"no such file: {args.original}", file=sys.stderr)
        return 2

    fw, fh = FRAMES[args.frame]
    im = Image.open(args.original)
    im.load()
    im = im.convert("RGB")

    height = round(args.width * fh / fw)
    right, bottom = args.left + args.width, args.top + height
    if args.left < 0 or args.top < 0 or right > im.width or bottom > im.height:
        print(
            f"crop [{args.left},{args.top} {args.width}x{height}] "
            f"falls outside {im.width}x{im.height}",
            file=sys.stderr,
        )
        return 1

    cut = im.crop((args.left, args.top, right, bottom))
    for scale in (1, args.scale):
        suffix = "" if scale == 1 else f"@{scale}x"
        out = SHOTS / f"{args.name}{suffix}.webp"
        cut.resize((fw * scale, fh * scale), Image.LANCZOS).save(out, "WEBP", **WEBP)
        print(
            f"  {out.name:<24} {fw*scale}x{fh*scale}  "
            f"{out.stat().st_size // 1024}KB  "
            f"from {args.original.name} [{args.left},{args.top} {args.width}x{height}]"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
