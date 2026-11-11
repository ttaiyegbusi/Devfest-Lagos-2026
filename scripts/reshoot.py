#!/usr/bin/env python3
"""Re-cut the panel photographs at 2x from their original files.

The twenty shots in public/expect are crops, authored at exactly the size they
are displayed — 220x249 for the strip, the grid and the after-party band,
492x567 for panel 01. That makes them pixel-perfect at 1x and upscaled by
exactly two on a 2x display, where they read soft. No encoder setting fixes
that: the detail is not in the file. Only a bigger cut of the original is.

Re-cropping twenty photographs by hand means matching twenty framings by eye,
and an eye that is a few pixels out shifts the picture. So this does not ask
anyone to re-crop. It takes the shots that already exist as the statement of
what the framing should be, finds each one inside its original, and cuts the
same rectangle again at twice the size.

    python3 scripts/reshoot.py <originals-dir> [--scale 2] [--check]

Every shot in public/expect is matched against every image in <originals-dir>,
so the files can be named anything and arrive in any order. Each match is
scored, anything doubtful is refused rather than guessed, and --check writes a
side-by-side proof so the framing can be seen rather than trusted.

Output is <name>@2x.webp beside each original shot, which is all the site needs
— retina() in app/expect/assets.ts picks it up on sight. Nothing is overwritten
and the 1x files are left exactly as they are.
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "public" / "expect"

# WebP q82 method 6, the same settings the twenty 1x files were encoded with.
# Keeping them identical means the 2x file is the same picture at a different
# size rather than a differently-processed one, which is what makes a srcset
# pair safe: the browser may pick either and they must agree.
WEBP = dict(quality=82, method=6)

# Below this the match is refused. Normalised cross-correlation runs -1..1 and
# a true match of a photograph against its own source sits well above 0.9 even
# after a resample; 0.80 leaves room for the resampling and the WebP pass
# without letting a confident-looking wrong answer through.
FLOOR = 0.80

# How many crop sizes to try between "the shot is the original, untouched" and
# "the shot is a small detail of a much larger frame". Log-spaced, because what
# matters is the ratio between successive guesses, not the pixel difference.
SCALE_STEPS = 48

# The search runs on images reduced to about this width. Full resolution buys
# nothing while picking a scale and costs the square of the width in time; the
# winner is refined at full resolution afterwards.
SEARCH_WIDTH = 760


def grey(im: Image.Image) -> np.ndarray:
    """Luminance as float32. Alpha is composited over mid-grey first.

    Panel 01's four shots carry a real alpha channel — the bowed print edge is
    drawn into the artwork — and the transparent border is not in the original
    photograph. Compositing over a flat mid-grey keeps those pixels from
    reading as a hard black or white frame that no original can match, while
    the interior, which is what actually identifies the crop, is untouched.
    """
    if im.mode in ("RGBA", "LA"):
        flat = Image.new("RGB", im.size, (128, 128, 128))
        flat.paste(im, mask=im.split()[-1])
        im = flat
    return np.asarray(im.convert("L"), dtype=np.float32)


def ncc(image: np.ndarray, template: np.ndarray) -> np.ndarray:
    """Normalised cross-correlation of `template` over `image`.

    Written out rather than imported: this machine has neither scipy nor
    OpenCV, and the standard formulation is short once the two halves are
    separated. The numerator is a cross-correlation, which the FFT does in one
    pass. The denominator needs the sum and the sum of squares of the image
    under every possible window position, which is what a summed-area table is
    for — two cumulative sums and four lookups per window, independent of how
    big the window is.

    Returns an array of scores, one per valid top-left position. Positions
    where the image window is flat (zero variance, e.g. a blown-out sky) score
    0 rather than dividing by zero.
    """
    ih, iw = image.shape
    th, tw = template.shape
    if th > ih or tw > iw:
        return np.empty((0, 0), dtype=np.float32)

    t0 = template - template.mean()
    t_energy = float(np.sqrt((t0 * t0).sum()))
    if t_energy == 0:
        return np.zeros((ih - th + 1, iw - tw + 1), dtype=np.float32)

    # Numerator. Because the template is zero-mean, the window's own mean
    # cancels out of the sum and a plain cross-correlation is enough.
    shape = (ih + th - 1, iw + tw - 1)
    fsize = [int(2 ** np.ceil(np.log2(s))) for s in shape]
    fi = np.fft.rfft2(image, fsize)
    ft = np.fft.rfft2(t0[::-1, ::-1], fsize)
    full = np.fft.irfft2(fi * ft, fsize)[: shape[0], : shape[1]]
    num = full[th - 1 :, tw - 1 :][: ih - th + 1, : iw - tw + 1]

    # Denominator, via summed-area tables over the image and its square.
    pad = np.zeros((ih + 1, iw + 1), dtype=np.float64)
    pad[1:, 1:] = image
    sat = pad.cumsum(0).cumsum(1)
    pad[1:, 1:] = image.astype(np.float64) ** 2
    sat2 = pad.cumsum(0).cumsum(1)

    def box(table: np.ndarray) -> np.ndarray:
        return (
            table[th:, tw:]
            - table[:-th, tw:]
            - table[th:, :-tw]
            + table[:-th, :-tw]
        )

    n = th * tw
    wsum = box(sat)
    wsum2 = box(sat2)
    var = wsum2 - (wsum * wsum) / n
    np.clip(var, 0, None, out=var)
    den = np.sqrt(var) * t_energy

    out = np.zeros_like(num, dtype=np.float32)
    ok = den > 1e-8
    out[ok] = (num[ok] / den[ok]).astype(np.float32)
    return out


@dataclass
class Match:
    original: Path
    score: float
    # The crop rectangle in the original's own pixels.
    left: int
    top: int
    width: int
    height: int


def locate(shot: Image.Image, original: Image.Image) -> Match | None:
    """Find the rectangle of `original` that `shot` was cut from.

    The shot's aspect ratio fixes the rectangle's shape, so only its width and
    its position are unknown. Candidate widths are swept from "the shot is the
    whole original" down to "the shot is a small detail"; at each one the
    original is reduced so that the candidate rectangle would come out at
    exactly the shot's size, and the shot is then looked for at 1:1.
    """
    sw, sh = shot.size
    ow, oh = original.size
    aspect = sw / sh

    t_full = grey(shot)

    # Search at reduced resolution: the shot and the original shrink together,
    # so the scale being tested is unchanged.
    reduce_by = min(1.0, SEARCH_WIDTH / max(ow, 1))
    t_small = (
        np.asarray(
            Image.fromarray(t_full).resize(
                (max(8, round(sw * reduce_by)), max(8, round(sh * reduce_by))),
                Image.LANCZOS,
            )
        )
        if reduce_by < 1.0
        else t_full
    )
    tsh, tsw = t_small.shape

    # The rectangle cannot be wider than the original, nor narrower than the
    # shot itself — a crop smaller than the file it produced would mean the
    # shot had been upscaled, which is the thing being fixed, not a framing.
    widest = min(ow, round(oh * aspect))
    if widest < sw:
        return None
    candidates = np.unique(
        np.round(np.geomspace(sw, widest, SCALE_STEPS)).astype(int)
    )

    best: tuple[float, int, int, int] | None = None
    for cw in candidates:
        ch = round(cw / aspect)
        if ch > oh or cw > ow:
            continue
        # Reduce the original so this candidate rectangle lands at the shot's
        # reduced size; then the template matches at 1:1.
        factor = tsw / cw
        rw, rh = round(ow * factor), round(oh * factor)
        if rw < tsw or rh < tsh:
            continue
        small = np.asarray(
            original.convert("RGB").resize((rw, rh), Image.LANCZOS).convert("L"),
            dtype=np.float32,
        )
        scores = ncc(small, t_small)
        if scores.size == 0:
            continue
        flat = int(scores.argmax())
        y, x = divmod(flat, scores.shape[1])
        s = float(scores[y, x])
        if best is None or s > best[0]:
            # Back to the original's own pixels.
            best = (s, round(x / factor), round(y / factor), int(cw))

    if best is None:
        return None
    score, left, top, cw = best
    ch = round(cw / aspect)
    left = max(0, min(left, ow - cw))
    top = max(0, min(top, oh - ch))
    return Match(Path(), score, left, top, cw, ch)


def refine(shot: Image.Image, original: Image.Image, m: Match) -> Match:
    """Nudge the rectangle at full resolution.

    The coarse pass works on a reduced copy, so its answer is only as precise
    as that reduction — a pixel there is several here. This re-scores a small
    neighbourhood of sizes and offsets at full resolution, which is cheap
    because the neighbourhood is small, and keeps the framing from sitting a
    few pixels off the original's.
    """
    sw, sh = shot.size
    ow, oh = original.size
    aspect = sw / sh
    t = grey(shot)

    span = max(2, round(m.width * 0.04))
    best = (-2.0, m.left, m.top, m.width)
    for cw in {
        max(sw, min(m.width + d, min(ow, round(oh * aspect))))
        for d in range(-span, span + 1, max(1, span // 4))
    }:
        ch = round(cw / aspect)
        for dy in range(-span, span + 1, max(1, span // 4)):
            for dx in range(-span, span + 1, max(1, span // 4)):
                left, top = m.left + dx, m.top + dy
                if left < 0 or top < 0 or left + cw > ow or top + ch > oh:
                    continue
                cut = original.crop((left, top, left + cw, top + ch)).resize(
                    (sw, sh), Image.LANCZOS
                )
                c = grey(cut)
                a, b = t - t.mean(), c - c.mean()
                d = float(np.sqrt((a * a).sum()) * np.sqrt((b * b).sum()))
                s = float((a * b).sum() / d) if d > 1e-8 else 0.0
                if s > best[0]:
                    best = (s, left, top, cw)

    score, left, top, cw = best
    return Match(m.original, max(score, m.score), left, top, cw, round(cw / aspect))


def cut(shot_path: Path, original: Image.Image, m: Match, scale: int) -> Image.Image:
    """Produce the 2x file: the same rectangle, at twice the size.

    If the shot carries alpha, the mask comes from the 1x file rather than from
    the original, which has none — panel 01's bowed print edge is drawn into
    the artwork, not photographed. Upscaling a mask is sound in a way that
    upscaling a photograph is not: it is a smooth shape with no detail to lose,
    so the edge stays the edge while the picture underneath gains real pixels.
    """
    shot = Image.open(shot_path)
    sw, sh = shot.size
    out_w, out_h = sw * scale, sh * scale

    body = original.convert("RGB").crop(
        (m.left, m.top, m.left + m.width, m.top + m.height)
    ).resize((out_w, out_h), Image.LANCZOS)

    if shot.mode in ("RGBA", "LA"):
        mask = shot.split()[-1].resize((out_w, out_h), Image.LANCZOS)
        body = body.convert("RGBA")
        body.putalpha(mask)
    return body


def proof(shot_path: Path, new: Image.Image, out: Path) -> None:
    """A side-by-side of the 1x shot and the new cut, both at the new size."""
    old = Image.open(shot_path).convert("RGB")
    big = old.resize(new.size, Image.NEAREST)
    flat = new.convert("RGB")
    w, h = flat.size
    sheet = Image.new("RGB", (w * 2 + 12, h), (20, 20, 20))
    sheet.paste(big, (0, 0))
    sheet.paste(flat, (w + 12, 0))
    sheet.save(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("originals", type=Path, help="directory of the full-size photographs")
    ap.add_argument("--scale", type=int, default=2)
    ap.add_argument("--only", help="substring: restrict to matching shot names")
    ap.add_argument("--check", action="store_true", help="also write side-by-side proofs")
    ap.add_argument("--proof-dir", type=Path, default=ROOT / "proof")
    args = ap.parse_args()

    if not args.originals.is_dir():
        print(f"not a directory: {args.originals}", file=sys.stderr)
        return 2

    originals = sorted(
        p
        for p in args.originals.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic"}
    )
    if not originals:
        print(f"no images in {args.originals}", file=sys.stderr)
        return 2

    shots = sorted(
        p
        for p in SHOTS.glob("*.webp")
        if "@" not in p.name and (not args.only or args.only in p.name)
    )
    if not shots:
        print("no 1x shots found", file=sys.stderr)
        return 2

    print(f"{len(shots)} shots against {len(originals)} originals\n")
    if args.check:
        args.proof_dir.mkdir(parents=True, exist_ok=True)

    loaded = {}
    for p in originals:
        try:
            im = Image.open(p)
            im.load()
            loaded[p] = im
        except Exception as e:  # noqa: BLE001 - a bad file should not stop the run
            print(f"  ! could not read {p.name}: {e}")

    written, refused = 0, []
    for sp in shots:
        shot = Image.open(sp)
        shot.load()
        best: Match | None = None
        for p, orig in loaded.items():
            if orig.width < shot.width * args.scale:
                continue  # too small to be worth cutting from
            m = locate(shot, orig)
            if m is None:
                continue
            m.original = p
            if best is None or m.score > best.score:
                best = m

        if best is None or best.score < FLOOR:
            got = f"{best.score:.3f} ({best.original.name})" if best else "nothing"
            print(f"  ? {sp.name:<26} no confident match — best {got}")
            refused.append(sp.name)
            continue

        orig = loaded[best.original]
        best = refine(shot, orig, best)
        if best.score < FLOOR:
            print(f"  ? {sp.name:<26} match degraded on refine ({best.score:.3f})")
            refused.append(sp.name)
            continue

        new = cut(sp, orig, best, args.scale)
        out = sp.with_name(f"{sp.stem}@{args.scale}x{sp.suffix}")
        new.save(out, "WEBP", **WEBP)
        kb = out.stat().st_size // 1024
        print(
            f"  + {out.name:<26} {new.width}x{new.height}  {kb}KB  "
            f"from {best.original.name} "
            f"[{best.left},{best.top} {best.width}x{best.height}]  r={best.score:.3f}"
        )
        if args.check:
            proof(sp, new, args.proof_dir / f"{sp.stem}.png")
        written += 1

    print(f"\n{written} written, {len(refused)} refused")
    if refused:
        print("refused: " + ", ".join(refused))
        print("Supply the originals for these, or crop them by hand at the sizes in HANDOFF.")
    if args.check:
        print(f"proofs in {args.proof_dir} — 1x on the left, the new cut on the right")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
