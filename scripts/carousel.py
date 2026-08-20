#!/usr/bin/env python3
"""Solve the speakers carousel geometry from the reference screenshot.

Given a reference frame of the curved wall, four measurements are enough to pin
down every constant exactly — there is no dialling in by eye:

  * the centre card's width and height
  * the two vertical edge heights of the card one step out
  * the projected centre offsets, one and two steps out

Those give perspective, per-step depth, per-step rotation and the horizontal
step, plus the exponent the step is raised to. Feed the results into
app/speakers/Speakers.css (--persp, --depth, --step) and Speakers.tsx (the
rotation and exponent).
"""
import math

REF_W = 1650          # width the measurements were taken at
CANVAS_W = 1440       # width we build to

Wc, Hc = 358, 337     # centre card
near1, far1 = 385, 330  # the two vertical edges of the card one step out
proj1 = 358           # its projected width
off1, off2 = 426, 797  # projected centre offsets, one and two steps out


def solve():
    rn, rf = near1 / Hc, far1 / Hc
    # rn = 1/(1 - u - v), rf = 1/(1 - u + v)
    #   u = z / p                     (how far forward the card sits)
    #   v = (W/2) sin(theta) / p      (how far its edges swing in z)
    u = 1 - (1 / rn + 1 / rf) / 2
    v = ((1 / rf) - (1 / rn)) / 2

    # projected width = W cos(theta) / (1 - u)
    theta = math.acos(proj1 * (1 - u) / Wc)
    p = (Wc / 2) * math.sin(theta) / v
    z = u * p

    xw1 = off1 * (1 - u)
    xw2 = off2 * (1 - 2 * z / p)
    exponent = math.log(xw2 / xw1) / math.log(2)
    return p, z, math.degrees(theta), xw1, exponent


def main() -> None:
    p, z, deg, step, exponent = solve()
    s = CANVAS_W / REF_W
    print(f"at {REF_W}px:  perspective {p:.0f}  depth {z:.1f}  "
          f"rotation {deg:.1f}deg  step {step:.0f}  exponent {exponent:.3f}")
    print(f"at {CANVAS_W}px: --persp {p * s:.0f}px  --depth {z * s:.1f}px  "
          f"--step {step * s:.0f}px  rotation {deg:.1f}deg  exponent {exponent:.3f}")

    W, H = Wc * s, Hc * s
    print("\nprojected, per step out:")
    for n in range(4):
        U = n * z * s / (p * s)
        V = (W / 2) * math.sin(n * math.radians(deg)) / (p * s)
        if 1 - U - V <= 0.05:
            print(f"  n={n}: past the vanishing plane")
            continue
        pw = W * math.cos(n * math.radians(deg)) / (1 - U)
        centre = (step * s * n ** exponent) / (1 - U)
        print(f"  n={n}: width {pw:6.0f}  nearEdge {H / (1 - U - V):6.0f}  "
              f"edges {centre - pw / 2:7.0f}..{centre + pw / 2:7.0f}")


if __name__ == "__main__":
    main()
