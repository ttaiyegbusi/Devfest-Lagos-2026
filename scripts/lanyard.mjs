/* Measure the ticket badges hanging on their lanyards.
 *
 * The physics has three jobs and each is a number, not an opinion:
 *
 *   SAG      A badge must hang where the grid put it. The first build used a
 *            chain of near-massless links and the badges outweighed the cord
 *            thousands to one, so they dragged it to the bottom of the page.
 *   PULL     Dragging one down must visibly stretch the cord — that is the
 *            whole idea — and the badge must come back when let go.
 *   REST     It has to stop. A marketing page holding a phone at 60fps to
 *            redraw a picture that is not moving is a battery bug.
 *
 * NOT RUN IN CI, unlike carousel.py and starters.mjs: this one needs a browser.
 * Install it first — `npm i -D playwright && npx playwright install chromium` —
 * then serve a build and point this at it:
 *
 *     npm run build && npm start &
 *     node scripts/lanyard.mjs http://localhost:3000/
 *
 * Worth running after touching anything in app/pricing/. The failure it exists
 * to catch is silent: the badges still render, they have just quietly gone
 * somewhere else on the page.
 */
import { chromium } from "playwright";

const URL_ = process.argv[2] ?? "http://localhost:3500/";
const CORD_LENGTH = 86;     // must match Lanyards.tsx
const CORD_TOLERANCE = 4;   // px of give in the cord at rest
const MIN_STRETCH = 40;     // px the cord must give under a full pull
const MAX_REST_MS = 9000;   // must settle within this of being let go

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let bad = 0;

for (const [label, vp] of [["1440", { width: 1440, height: 900 }], ["390", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 768, hasTouch: vp.width < 768 });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await p.goto(URL_, { waitUntil: "networkidle" });

  await p.evaluate(async () => {
    const t = document.querySelector(".tickets").getBoundingClientRect().top + scrollY;
    for (let y = 0; y < t + innerHeight * 0.35; y += 140) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
  });

  const rested = await p.evaluate(async () => {
    const rack = document.querySelector(".rack");
    const t0 = performance.now();
    while (performance.now() - t0 < 12000 && !rack.classList.contains("is-settled"))
      await new Promise((r) => setTimeout(r, 80));
    return { ms: Math.round(performance.now() - t0), settled: rack.classList.contains("is-settled") };
  });

  /* What a hanging badge must satisfy is that its cord is at its rest length —
     not that it matches a slot measured earlier, because the page shifts
     between page load and the physics starting and that comparison then
     reports a sag that is not there. The cord is the invariant. */
  const hang = await p.evaluate(() =>
    [...document.querySelectorAll(".rack__cord")].map((c) => {
      const [a, b] = c.getAttribute("points").split(" ").map((s) => s.split(",").map(Number));
      return Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]));
    }));
  // And no badge may escape the section it belongs to — the collapse this
  // whole harness exists to catch dragged them into the section below.
  const inside = await p.evaluate(() => {
    const sec = document.querySelector(".tickets").getBoundingClientRect();
    return [...document.querySelectorAll(".badge")].every((e) => {
      const r = e.getBoundingClientRect();
      return r.top >= sec.top - 1 && r.bottom <= sec.bottom + 1;
    });
  });

  const worst = Math.max(...hang.map((h) => Math.abs(h - CORD_LENGTH)));
  const hangOk = worst <= CORD_TOLERANCE;
  const restOk = rested.settled && rested.ms <= MAX_REST_MS;
  if (!hangOk) bad++;
  if (!restOk) bad++;
  if (!inside) bad++;

  console.log(`\n${label}`);
  console.log(`  cord at rest     ${hang.join(", ")} px  (want ${CORD_LENGTH})   off by ${worst}   ${hangOk ? "ok" : `<-- over ${CORD_TOLERANCE}px`}`);
  console.log(`  inside section   ${inside ? "yes   ok" : "NO    <-- a badge escaped"}`);
  console.log(`  came to rest     ${rested.settled ? rested.ms + "ms" : "NEVER (>12s)"}   ${restOk ? "ok" : "<-- too slow"}`);

  // Pull the first badge down by its grip and watch the cord give.
  const pull = await p.evaluate(async () => {
    const rack = document.querySelector(".rack");
    const grip = document.querySelector(".badge .badge__grip");
    const badge = document.querySelector(".badge");
    const g = grip.getBoundingClientRect();
    const cordLen = () => {
      const pts = document.querySelector(".rack__cord").getAttribute("points").split(" ").map((s) => s.split(",").map(Number));
      return Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    };
    const restLen = cordLen();
    const restY = badge.getBoundingClientRect().top;
    const send = (type, x, y) => rack.dispatchEvent(new PointerEvent(type, {
      pointerId: 1, pointerType: "mouse", clientX: x, clientY: y, bubbles: true, cancelable: true,
    }));
    // pointerdown has to land on the grip for the hit test to find the badge.
    grip.dispatchEvent(new PointerEvent("pointerdown", {
      pointerId: 1, pointerType: "mouse", clientX: g.left + g.width / 2, clientY: g.top + g.height / 2,
      bubbles: true, cancelable: true,
    }));
    let maxLen = restLen;
    for (let i = 1; i <= 24; i++) {
      send("pointermove", g.left + g.width / 2, g.top + g.height / 2 + i * 9);
      await new Promise((r) => requestAnimationFrame(r));
      maxLen = Math.max(maxLen, cordLen());
    }
    const pulledY = badge.getBoundingClientRect().top;
    send("pointerup", g.left + g.width / 2, g.top + g.height / 2 + 216);
    const t0 = performance.now();
    while (performance.now() - t0 < 12000 && !rack.classList.contains("is-settled"))
      await new Promise((r) => setTimeout(r, 80));
    return {
      restLen: Math.round(restLen), maxLen: Math.round(maxLen),
      moved: Math.round(pulledY - restY),
      backTo: Math.round(badge.getBoundingClientRect().top - restY),
      recoverMs: Math.round(performance.now() - t0),
      settled: rack.classList.contains("is-settled"),
    };
  });

  const stretch = pull.maxLen - pull.restLen;
  const stretchOk = stretch >= MIN_STRETCH;
  const backOk = pull.settled && Math.abs(pull.backTo) <= CORD_TOLERANCE;
  if (!stretchOk) bad++;
  if (!backOk) bad++;
  console.log(`  cord under pull  ${pull.restLen} -> ${pull.maxLen} px  (+${stretch})   ${stretchOk ? "ok" : `<-- under ${MIN_STRETCH}px, no give`}`);
  console.log(`  badge travelled  ${pull.moved} px down`);
  console.log(`  sprang back to   ${pull.backTo >= 0 ? "+" : ""}${pull.backTo} px in ${pull.settled ? pull.recoverMs + "ms" : "NEVER"}   ${backOk ? "ok" : "<-- did not return"}`);
  if (errs.length) { console.log("  errors:", errs); bad++; }
  await ctx.close();
}

await b.close();
console.log(bad ? `\n${bad} check(s) failed.` : "\nThe lanyards hang, stretch and settle.");
process.exit(bad ? 1 : 0);
