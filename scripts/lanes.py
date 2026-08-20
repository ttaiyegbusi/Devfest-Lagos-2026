"""Generate the traffic keyframes from the road as it is actually drawn.

Road path 84:
  near edge : cubic (1334.45,1062.39) -> (1003.04,791.23)
  far  edge : cubic (995.274,790.93) -> (1167.99,798.505)
              cubic (1167.99,798.505) -> (1657.22,852.492)
Everything below works in artwork coordinates. Horizon y = 791.
"""
def bez(P, t):
    u = 1 - t
    return (u**3*P[0][0] + 3*u*u*t*P[1][0] + 3*u*t*t*P[2][0] + t**3*P[3][0],
            u**3*P[0][1] + 3*u*u*t*P[1][1] + 3*u*t*t*P[2][1] + t**3*P[3][1])

NEAR = [(1334.45,1062.39),(1334.45,1062.39),(1176.68,813.486),(1003.04,791.23)]
FAR  = [[(995.274,790.93),(995.274,790.93),(989.507,773.964),(1167.99,798.505)],
        [(1167.99,798.505),(1346.48,823.045),(1657.22,852.492),(1657.22,852.492)]]

def _solve(P, y, descending):
    lo, hi = 0.0, 1.0
    for _ in range(70):
        t = (lo + hi) / 2
        yy = bez(P, t)[1]
        if (yy > y) == descending: lo = t
        else: hi = t
    return bez(P, (lo + hi) / 2)[0]

def nearX(y):  return _solve(NEAR, y, True)
def farX(y):
    if y <= bez(FAR[0], 1.0)[1]: return _solve(FAR[0], y, False)
    if y <= 852.492:             return _solve(FAR[1], y, False)
    return 1657.22 + (y - 852.492) / 224.548 * 7.71   # right-hand boundary

class V:
    def __init__(self, name, xd, yd, halfw, ht, href, lane, h0, h1):
        self.name, self.xd, self.yd = name, xd, yd
        self.halfw, self.ht, self.href = halfw, ht, href
        self.lane, self.h0, self.h1 = lane, h0, h1
    def at(self, h):
        y = 791 + h
        a, b = nearX(y), farX(y)
        xc = a + self.lane * (b - a)
        s  = h / self.href
        return dict(h=h, y=y, xc=xc, s=s,
                    tx=xc - 999 - (self.xd - 999) * s,
                    ty=h - (self.yd - 791) * s,
                    left=xc - self.halfw * s, right=xc + self.halfw * s,
                    w=2 * self.halfw * s, hgt=self.ht * s,
                    lanepct=100 * (xc - a) / (b - a))
    def rows(self, n=13, travel=96.0, gamma=1.5):
        out = []
        for i in range(n):
            p = i / (n - 1)
            h = self.h0 + (self.h1 - self.h0) * p**gamma
            d = self.at(h)
            out.append((round(travel * p, 1), d))
        return out

danfo = V("danfo", 1288, 886.5, 124.3, 161, 95.5, lane=0.82, h0=4,  h1=66)
keke  = V("keke",  1105, 817,   34.85,  98,  45,  lane=0.70, h0=3,  h1=64)

for v in (danfo, keke):
    print(f"\n--- {v.name}: lane {v.lane:.2f} held throughout, depth {v.h0}->{v.h1} ---")
    print(f"{'t%':>6} {'scale':>6} {'tx':>7} {'ty':>6} {'left':>6} {'w':>5} {'h':>5} {'lane%':>6} {'travel':>7}")
    prev = None
    for t, d in v.rows():
        tv = "" if prev is None else f"{d['xc']-prev:.0f}"
        prev = d['xc']
        print(f"{t:>6.1f} {d['s']:>6.3f} {d['tx']:>7.1f} {d['ty']:>6.1f} {d['left']:>6.0f} "
              f"{d['w']:>5.0f} {d['hgt']:>5.0f} {d['lanepct']:>5.1f}% {tv:>7}")

css = []
for v in (danfo, keke):
    css.append(f"@keyframes hero-{v.name} {{")
    rows = v.rows()
    for i, (t, d) in enumerate(rows):
        op = "0" if i == 0 else "1"
        css.append(f"  {t}% {{\n    transform: translate({d['tx']:.1f}px, {d['ty']:.1f}px) "
                   f"scale({d['s']:.3f});\n    opacity: {op};\n  }}")
    f = rows[0][1]
    css.append(f"  100% {{\n    transform: translate({f['tx']:.1f}px, {f['ty']:.1f}px) "
               f"scale({f['s']:.3f});\n    opacity: 0;\n  }}")
    css.append("}\n")
open("keyframes.css", "w").write("\n".join(css))
print("\nwrote keyframes.css")
