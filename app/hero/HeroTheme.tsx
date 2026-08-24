"use client";

import { useSyncExternalStore } from "react";

/* The hero's own light switch.
 *
 * Only the hero changes. The rest of the page stays as it is, so this is not a
 * site-wide colour scheme and deliberately does not follow the operating
 * system's: a reader whose phone is in dark mode has not asked for one section
 * of this page to be night and the next six to be cream. It is an explicit
 * choice, and it is remembered.
 *
 * The state lives on <html data-hero-theme>, not in React. The stylesheet
 * reads it there, and the script in app/layout.tsx stamps it before the first
 * paint — which is the only way to open a remembered dark hero without a
 * frame of cream first. This component owns the switch and mirrors the value
 * into `aria-pressed`; it never owns the appearance. */

/* Written here and read by the pre-paint script in app/layout.tsx, which
   cannot import it — it is a string in a <script> tag. Both spellings have to
   match, and this is the one that matters. */
const HERO_THEME_KEY = "devfest:hero-theme";

/* Android tints its browser chrome with this, and the hero is what sits under
   it at the top of the page — so the tint follows the hero rather than
   staying cream over a night sky. The light value is the one app/layout.tsx
   ships in `viewport.themeColor`; keep the two in step. */
const CHROME = { light: "#fff5d4", dark: "#0e1526" };

/* <html data-hero-theme> is the source of truth, and it is written by two
   different things — the pre-paint script on load, and this button afterwards
   — so the button subscribes to the attribute rather than keeping a second
   copy of it in React state. Watching it means the two can never disagree, and
   it costs one observer.

   The server snapshot is `false` because the server cannot know: the choice is
   in the reader's browser. React hydrates against that and immediately
   re-renders with the real value, which is why only `aria-pressed` settles a
   beat late and never the colours — those are the stylesheet's, off the same
   attribute, correct from the first paint. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-hero-theme"],
  });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.dataset.heroTheme === "dark";

export function HeroTheme() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = () => {
    const next = !dark;

    const root = document.documentElement;
    if (next) root.dataset.heroTheme = "dark";
    else delete root.dataset.heroTheme;

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next ? CHROME.dark : CHROME.light);

    // Private browsing and blocked site data both throw here. Losing the
    // preference is a small thing; losing the toggle is not.
    try {
      localStorage.setItem(HERO_THEME_KEY, next ? "dark" : "light");
    } catch {
      /* not remembered, still switched */
    }
  };

  return (
    /* A toggle button, not two buttons or a checkbox: one control whose name
       stays put while its state changes, which is what `aria-pressed` is for.
       A label that flips between "dark" and "light" would be read out as a
       different control each time it is used. */
    <button
      type="button"
      className="hero-theme"
      aria-pressed={dark}
      onClick={toggle}
    >
      <span className="visually-hidden">Dark hero</span>

      {/* One shape throughout, the same way the hamburger becomes the cross:
          the sun is not swapped for a moon, it is eclipsed. A black disc rides
          in from off-canvas and takes a bite out of the sun through a mask
          while the rays retract into it. Nothing appears or disappears — the
          crescent is what is left of the sun. */}
      <svg
        className="hero-theme__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <mask
          id="hero-theme-eclipse"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <rect width="24" height="24" fill="#fff" />
          <circle className="hero-theme__bite" cx="24" cy="6" r="7" fill="#000" />
        </mask>

        <circle
          className="hero-theme__core"
          cx="12"
          cy="12"
          r="5"
          fill="currentColor"
          mask="url(#hero-theme-eclipse)"
        />

        <g
          className="hero-theme__rays"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <line x1="12" y1="1.7" x2="12" y2="3.9" />
          <line x1="12" y1="20.1" x2="12" y2="22.3" />
          <line x1="1.7" y1="12" x2="3.9" y2="12" />
          <line x1="20.1" y1="12" x2="22.3" y2="12" />
          <line x1="4.8" y1="4.8" x2="6.4" y2="6.4" />
          <line x1="17.6" y1="17.6" x2="19.2" y2="19.2" />
          <line x1="4.8" y1="19.2" x2="6.4" y2="17.6" />
          <line x1="17.6" y1="6.4" x2="19.2" y2="4.8" />
        </g>
      </svg>
    </button>
  );
}
