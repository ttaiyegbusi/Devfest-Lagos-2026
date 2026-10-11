"""Generate the hero traffic keyframes from the road as it is actually drawn.

Road path 84:
  near edge : cubic (1334.45,1062.39) -> (1003.04,791.23)
  far  edge : cubic (995.274,790.93) -> (1167.99,798.505)
              cubic (1167.99,798.505) -> (1657.22,852.492)
Everything below works in artwork coordinates. Horizon y = 791.

Both vehicles ride ONE track — the danfo's. The keke used to have its own, derived
from its own clearance, and it put the whole of its run just outside the bottom
right corner: 101% to 112% across the frame, every cycle, never once in shot. A
fixed matrix in HeroScene.tsx now sets the keke's wheels on the danfo's wheels and
sizes it down to a tricycle, so there is only one path to get right.

The track holds the curve rather than hurrying out of it, because the thing being
sold is a vehicle driving round a bend. `BEND` below is what buys that: under 1 it
lingers in the upper, curved stretch.

Size is capped. Left to true perspective the danfo swells about fivefold and ends
up filling the frame just as it leaves, which reads as a vehicle lunging at the
camera rather than driving past. It grows while it is small and far away, then
holds flat and simply travels.
"""
import math

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
        if (bez(P, t)[1] > y) == descending: lo = t
        else: hi = t
    return bez(P, (lo + hi) / 2)[0]

def nearX(y):  return _solve(NEAR, y, True)
def farX(y):
    if y <= bez(FAR[0], 1.0)[1]: return _solve(FAR[0], y, False)
    if y <= 852.492:             return _solve(FAR[1], y, False)
    return 1657.22 + (y - 852.492) / 224.548 * 7.71

XD, YD, HALFW, HREF = 1288, 886.5, 124.3, 95.5   # danfo anchor, half width, depth at scale 1
CAP   = 0.42        # it stops growing here: 104px wide, about 7% of the frame
LANE0, LANE1 = 0.44, 0.62   # mid road, drifting out as the bend opens — the line a driver takes
BEND  = 0.72        # < 1 keeps it in the curve longer
CLEAR = 40          # how far past the frame edge it must be before it is parked
H0, N = 6.0, 26
WINDOWS = {"danfo": (0.0, 48.0), "keke": (50.0, 98.0)}   # one at a time, no empty road

def lane_at(q): return LANE0 + (LANE1 - LANE0) * (q ** 1.3)

def xc_at(h, q):
    """Centre of the lane at depth h. Past y=1062 the drawn kerbs stop, so the lane
    continues as the ray out of the vanishing point that it already is."""
    y = 791 + h; L = lane_at(q)
    if y <= 1062:
        a, b = nearX(y), farX(y); return a + L*(b-a)
    a, b = nearX(1062), farX(1062)
    return 999 + ((a + L*(b-a)) - 999) * (y - 791) / 271.0

def track():
    h_gone = 271.0
    for i in range(60, 12000):
        h = i/10
        if xc_at(h, 1.0) - HALFW*CAP > 1440 + CLEAR: h_gone = h; break
    x0, x1 = xc_at(H0, 0.0), xc_at(h_gone, 1.0)
    pts = []
    for i in range(N):
        q = i/(N-1)
        e = (q**BEND)*0.78 + q*q*(3-2*q)*0.22      # eased, and weighted into the bend
        xt = x0 + (x1-x0)*e
        lo, hi = H0, h_gone
        for _ in range(60):
            m = (lo+hi)/2
            if xc_at(m, q) < xt: lo = m
            else: hi = m
        h = (lo+hi)/2; s = min(h/HREF, CAP); x = xc_at(h, q)
        pts.append(dict(q=q, h=h, y=791+h, s=s,
                        tx=x-999-(XD-999)*s, ty=h-(YD-791)*s))
    # heading of the path, damped: it leans into the bend rather than spinning
    for i, d in enumerate(pts):
        a, b = pts[max(0,i-1)], pts[min(N-1,i+1)]
        d["ang"] = math.degrees(math.atan2(b["y"]-a["y"], b["x"]-a["x"])) if False else \
                   math.degrees(math.atan2(b["y"]-a["y"],
                     (xc_at(b["h"], b["q"]) - xc_at(a["h"], a["q"])) or 1e-6))
    base = pts[N//2]["ang"]
    for d in pts:
        d["rot"] = round(max(-8.0, min(8.0, (d["ang"]-base)*0.45)), 2)
        d["sx"]  = round(1 - min(0.09, abs(d["ang"]-base)/90*0.5), 3)
    return pts

def emit(pts):
    out, park = [], pts[-1]
    for name, (a, b) in WINDOWS.items():
        at = lambda q: a + (b-a)*q
        parked = (f"transform: translate({park['tx']:.1f}px, {park['ty']:.1f}px) "
                  f"scale({park['s']:.3f}); opacity: 0;")
        out.append(f"@keyframes hero-{name} {{")
        if a > 0:
            out.append(f"  0% {{ {parked} }}")
            out.append(f"  {a-0.01:.2f}% {{ {parked} }}")
        for i, d in enumerate(pts):
            out.append(f"  {at(d['q']):.2f}% {{ transform: translate({d['tx']:.1f}px, {d['ty']:.1f}px) "
                       f"scale({d['s']:.3f}); opacity: {0 if i == 0 else 1}; }}")
        out.append(f"  {min(99.99, b+0.01):.2f}% {{ {parked} }}")
        out.append(f"  100% {{ {parked} }}")
        out.append("}")
        out.append("")
        out.append(f"@keyframes hero-{name}-body {{")
        if a > 0: out.append(f"  0% {{ rotate: {pts[0]['rot']}deg; scale: {pts[0]['sx']} 1; }}")
        for d in pts:
            out.append(f"  {at(d['q']):.2f}% {{ rotate: {d['rot']}deg; scale: {d['sx']} 1; }}")
        out.append(f"  100% {{ rotate: {pts[0]['rot']}deg; scale: {pts[0]['sx']} 1; }}")
        out.append("}")
        out.append("")
    return "\n".join(out)

if __name__ == "__main__":
    pts = track()
    print(f"track: {2*HALFW*pts[0]['s']:.0f}px -> {2*HALFW*pts[-1]['s']:.0f}px wide, "
          f"drop {pts[-1]['y']-pts[0]['y']:.0f}px, "
          f"lean {min(d['rot'] for d in pts):.1f}deg to {max(d['rot'] for d in pts):.1f}deg")
    open("keyframes.css", "w").write(emit(pts))
    print("wrote keyframes.css")
