"use client";

import { useEffect } from "react";
import "./Reveal.css";

/* Scroll-in reveals.

   Sections mark themselves up in their own JSX: `data-reveal` on a group,
   `data-rise` on each thing inside it that should arrive. The group is what
   gets watched; when it crosses the line the whole group is released at once
   and the stylesheet deals its members out in order. No scroll handler — the
   observers do the watching and each group is dropped the moment it fires.

   NOTHING IS HIDDEN UNLESS THIS IS GOING TO RUN. The hidden state is keyed on
   `<html data-motion>`, which an inline script in the layout stamps before the
   first paint — so there is no flash of the laid-out page collapsing, and no
   script means no stamp means no hiding. That same script skips the stamp
   under prefers-reduced-motion, which is why the stylesheet has no
   reduced-motion rule: there is nothing there to undo.

   A group is released once and stays released. Re-hiding on the way back up
   makes a page feel like it is fighting the reader, and re-running the cascade
   on every pass turns a first impression into a tic. */

/** How far up the viewport a group's leading edge comes before it is released,
 *  as a fraction of the screen.
 *
 *  Two lines, not one. A section in normal flow goes as soon as it is properly
 *  on screen. A panel in the pinned stack arrives tilted and straightens as it
 *  lands, and starting its text while the slab is still swinging reads as two
 *  separate things moving at once — so those wait until it is all but flat. */
const TRIGGER = { near: 0.18, late: 0.55 };

export function Reveal() {
  useEffect(() => {
    const show = (el: Element) => el.setAttribute("data-shown", "");

    // No observer — an old browser, or one with it switched off. Show the page
    // rather than leave the reader looking at nothing.
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach(show);
      return;
    }

    /* Two observers watch every group — its own line, and the full-visibility
       net below — so whichever fires first has to take the group off both.
       Without that the loser keeps watching a group that is already released,
       and sets the attribute a second time when it eventually fires. */
    const watching = new Map<Element, IntersectionObserver[]>();

    const release = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const pair = watching.get(entry.target);
        if (!pair) continue;
        watching.delete(entry.target);
        for (const io of pair) io.unobserve(entry.target);
        show(entry.target);
      }
    };

    const line = (fraction: number) =>
      new IntersectionObserver(release, {
        rootMargin: `0px 0px -${Math.round(fraction * 100)}% 0px`,
      });

    const near = line(TRIGGER.near);
    const late = line(TRIGGER.late);

    /* The last thing on the page can never reach a line 18% up the screen: the
       document runs out of scroll while it is still in the bottom strip, and
       it would sit there hidden forever. So a group is also released once it
       is simply all on screen — which for anything mid-page happens later than
       its own line and so never gets there first, and for the footer's last
       line is the only thing that ever will. */
    const whole = new IntersectionObserver(release, { threshold: 1 });

    const known = new WeakSet<Element>();

    const attach = (root: ParentNode) => {
      for (const group of root.querySelectorAll<HTMLElement>("[data-reveal]")) {
        if (known.has(group)) continue;
        known.add(group);

        // Each member's place in its own group's queue, read once. The
        // stylesheet turns it into a delay, so none of this runs again while
        // scrolling. A group that is its own single member has no queue.
        group
          .querySelectorAll<HTMLElement>("[data-rise]")
          .forEach((el, i) => el.style.setProperty("--rise-i", String(i)));

        // Written bare in JSX, `data-reveal` reaches the DOM as the string
        // "true", so `late` is the opt-in rather than both being named.
        const own = group.getAttribute("data-reveal") === "late" ? late : near;
        watching.set(group, [own, whole]);
        own.observe(group);
        whole.observe(group);
      }
    };

    attach(document);

    /* Not every section is in the document when this first runs: the FAQ is
       behind a Suspense boundary and arrives in a later commit. Watching for
       what turns up afterwards is what keeps it from being skipped — and means
       a section added later needs nothing here. */
    const added = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) attach(node.parentNode ?? node);
        }
      }
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      added.disconnect();
      near.disconnect();
      late.disconnect();
      whole.disconnect();
    };
  }, []);

  return null;
}
