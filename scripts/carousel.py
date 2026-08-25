#!/usr/bin/env python3
"""Solve and check the speakers wall.

THE MODEL. The cards lie on a circle. A card `t` degrees around it sits at
(R sin t, R(1 - cos t)) and is turned by exactly that same t, so its facing and
its position come from one angle — which is what makes the row read as a single
curved surface rather than a set of separately placed cards.

An earlier version of this script solved a different model: a power-law
horizontal offset with a linear depth per step, printing `--persp`, `--depth`,
`--step` and an exponent. Two of those survived into the code (the step and the
18.5 degree rotation) and two describe nothing that exists any more. Deriving x
and z from separate curves leaves every card facing slightly wrong for where it
actually is: each card looks fine alone and the row looks broken. This script
now solves what the component implements.

WHAT IS MEASURED AND WHAT IS CHOSEN. Four measurements off the reference frame
fix the angle, the step, and both ratios the wall holds at every breakpoint:

  * the centre card's width and height
  * the two vertical edge heights of the card one step out  -> its own depth,
    and how far its edges swing in z, neither of which depends on the model
  * that card's projected width                             -> the rotation
  * its projected centre offset                             -> the step

One number is a choice rather than a measurement: how far forward the card two
steps out is allowed to come. The number to hold is not the scale at its centre
but at its NEAR EDGE, because that is what sets how tall the card stands. 1.25x
is enough to read as an arc coming towards you and little enough that the card
still sits inside the section. That single target fixes the perspective.

Run it after touching --card-w, --step, --arc-r, --persp or ARC. It re-derives
everything from the reference, prints what each breakpoint should hold, checks
what is committed, and exits non-zero if they have drifted apart.
"""

from __future__ import annotations

import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "app" / "speakers" / "Speakers.css"
TSX = ROOT / "app" / "speakers" / "Speakers.tsx"

# --- measured off the reference frame ----------------------------------------
REF_W = 1650  # the width those measurements were taken at
CARD_W, CARD_H = 358, 337  # the centre card
NEAR_1, FAR_1 = 385, 330  # the two vertical edges of the card one step out
PROJ_1 = 358  # its projected width
OFF_1, OFF_2 = 426, 797  # projected centre offsets, one and two steps out

# --- the one chosen number ---------------------------------------------------
NEAR_EDGE_AT_2 = 1.25  # how far forward the card two steps out may come

# A length within this of its target is rounding, not drift.
TOLERANCE_PX = 2.0


class Solution:
    """Everything the wall needs, derived from the measurements above."""

    def __init__(self) -> None:
        # The card's own depth, and how far its edges swing in z, both as a
        # fraction of the perspective. Neither depends on the model: they come
        # straight from the two edge heights.
        depth = 1 - (CARD_H / NEAR_1 + CARD_H / FAR_1) / 2
        swing = (CARD_H / FAR_1 - CARD_H / NEAR_1) / 2

        # Projected width = W cos(t) / (1 - depth), so the rotation falls out.
        self.arc = math.acos(PROJ_1 * (1 - depth) / CARD_W)

        # Un-project the measured offset to get the real horizontal step.
        self.step = OFF_1 * (1 - depth)

        # The circle that passes through that step at that angle.
        self.radius = self.step / math.sin(self.arc)

        # Both ratios the wall keeps at every size.
        self.card_ratio = CARD_W / self.radius
        self.aspect = CARD_H / CARD_W

        # Perspective from the near-edge target at two steps out.
        two = 2 * self.arc
        forward = self.radius * (1 - math.cos(two)) + (CARD_W / 2) * math.sin(two)
        self.persp = forward / (1 - 1 / NEAR_EDGE_AT_2)
        self.persp_ratio = self.persp / self.radius

        # What the reference itself said the card's depth was, which the
        # circle is free to disagree with — main() reports by how much.
        self.measured_depth = depth * ((CARD_W / 2) * math.sin(self.arc) / swing)

    @property
    def arc_deg(self) -> float:
        return math.degrees(self.arc)

    def projected_offset(self, n: int) -> float:
        """Where the centre of card `n` lands, in reference pixels."""
        t = n * self.arc
        x = self.radius * math.sin(t)
        z = self.radius * (1 - math.cos(t))
        return x / (1 - z / self.persp)

    def projected_width(self, n: int, card_w: float, radius: float, persp: float) -> float:
        t = n * self.arc
        z = radius * (1 - math.cos(t))
        return card_w * math.cos(t) / (1 - z / persp)

    def near_edge_scale(self, n: int, card_w: float, radius: float, persp: float) -> float:
        t = n * self.arc
        forward = radius * (1 - math.cos(t)) + (card_w / 2) * math.sin(t)
        return 1 / (1 - forward / persp)

    def step_ratio(self) -> float:
        """Step as a fraction of the card's width — held at every breakpoint."""
        return self.step / CARD_W


def committed() -> list[tuple[str, dict[str, float]]]:
    """Read the custom properties out of Speakers.css, in source order."""
    css = CSS.read_text()
    blocks: list[tuple[str, dict[str, float]]] = []
    label = "1440 and up"
    for chunk in re.split(r"@media\s*\(([^)]*)\)", css):
        found = {
            name: float(value)
            for name, value in re.findall(
                r"--(card-w|card-h|step|arc-r|persp):\s*(\d+(?:\.\d+)?)px", chunk
            )
        }
        if len(found) == 5:
            blocks.append((label, found))
        elif re.fullmatch(r"max-width:\s*\d+px", chunk.strip()):
            label = chunk.strip()
    return blocks


def committed_arc() -> float | None:
    match = re.search(r"const ARC = ([\d.]+);", TSX.read_text())
    return float(match.group(1)) if match else None


def main() -> int:
    wall = Solution()
    ok = True

    print("Solved from the reference frame")
    print("-------------------------------")
    print(f"  rotation per step   {wall.arc_deg:.2f}deg")
    print(f"  horizontal step     {wall.step:.1f}px  at {REF_W}")
    print(f"  radius = step/sin   {wall.radius:.1f}px  at {REF_W}")
    print(f"  card-w / radius     {wall.card_ratio:.4f}")
    print(f"  card-h / card-w     {wall.aspect:.4f}")
    print(f"  perspective / radius{wall.persp_ratio:9.4f}   "
          f"(near edge at n=2 reaches {NEAR_EDGE_AT_2}x)")

    print("\nHow faithful the circle is to the reference")
    print("-------------------------------------------")
    print("  The circle is fixed by the step and the angle, so it is free to")
    print("  disagree with the reference about depth — and it does:")
    circle_depth = wall.radius * (1 - math.cos(wall.arc))
    print(f"    card depth at n=1   circle {circle_depth:6.1f}   "
          f"reference {wall.measured_depth:6.1f}")
    for n, measured in ((1, OFF_1), (2, OFF_2)):
        got = wall.projected_offset(n)
        print(f"    centre offset n={n}   circle {got:6.1f}   "
              f"reference {measured:6.1f}   ({100 * (got / measured - 1):+.1f}%)")
    print("  Accepted knowingly: a card that faces exactly where it sits is")
    print("  worth more than one that lands on the reference's own offsets.")

    print("\nWhat each breakpoint holds")
    print("--------------------------")
    print("  Card width is the design's choice per breakpoint. Everything else")
    print("  is checked against it, and against the two rules the wall states:")
    print("  radius = step / sin(ARC), and the near edge two steps out reaching")
    print(f"  {NEAR_EDGE_AT_2}x. Those two are exact and are checked tightly; the ratios")
    print("  back to the reference are design and are only reported.")

    blocks = committed()
    if not blocks:
        print("  ! could not read any breakpoint out of Speakers.css")
        return 1

    arc = committed_arc()
    if arc is None:
        print("  ! could not find `const ARC =` in Speakers.tsx")
        return 1
    arc_rad = math.radians(arc)

    for label, have in blocks:
        card_w, card_h = have["card-w"], have["card-h"]
        step, radius, persp = have["step"], have["arc-r"], have["persp"]
        print(f"\n  {label}")
        print(f"    --card-w {card_w:7.0f}   --card-h {card_h:7.0f}   "
              f"--step {step:6.0f}   --arc-r {radius:6.0f}   --persp {persp:6.0f}")

        # Rule one: the radius is the circle through that step at that angle.
        want_radius = step / math.sin(arc_rad)
        drift = radius - want_radius
        bad = abs(drift) > TOLERANCE_PX
        ok = ok and not bad
        print(f"    radius = step/sin(ARC)      {want_radius:8.1f}   "
              f"committed {radius:6.0f}   ({drift:+.1f}px)"
              + ("   <-- DRIFTED" if bad else ""))

        # Rule two: the near edge two steps out comes exactly this far forward.
        got = wall.near_edge_scale(2, card_w, radius, persp)
        bad = abs(got - NEAR_EDGE_AT_2) > 0.005
        ok = ok and not bad
        print(f"    near-edge scale at n=2      {NEAR_EDGE_AT_2:8.3f}   "
              f"committed {got:6.3f}" + ("   <-- DRIFTED" if bad else ""))

        # Design ratios: reported, not enforced.
        widths = " / ".join(
            f"{wall.projected_width(n, card_w, radius, persp):.0f}"
            for n in range(3)
        )
        print(f"    card-w/radius {card_w / radius:.4f}  (reference {wall.card_ratio:.4f})   "
              f"card-h/card-w {card_h / card_w:.4f}  (reference {wall.aspect:.4f})")
        print(f"    step/card-w   {step / card_w:.4f}  (reference {wall.step_ratio():.4f})")
        print(f"    projected widths out from the centre: {widths}px")

    arc = committed_arc()
    print("\nARC in Speakers.tsx")
    print("-------------------")
    if arc is None:
        print("  ! could not find `const ARC =` in Speakers.tsx")
        ok = False
    else:
        drift = arc - wall.arc_deg
        print(f"  {arc}deg   solved {wall.arc_deg:.2f}deg   ({drift:+.2f}deg)")
        if abs(drift) > 0.05:
            ok = False

    print()
    print("Everything holds." if ok else "DRIFTED — the numbers above disagree.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
