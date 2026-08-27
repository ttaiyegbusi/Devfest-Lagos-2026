"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { DevFestLogo } from "./DevFestLogo";
import { HeroTheme } from "./HeroTheme";
import { TICKETS } from "../links";

/* `href` is deliberately optional. These used to point at anchors — #about,
   #pricing, #community-board — and not one of those ids existed anywhere in the
   markup, so the whole nav was dead: clicking did nothing at all. A link that
   goes nowhere is worse than plain text, so an entry without a destination
   renders as text until it has one.

   Every entry now goes somewhere. Speaker, Schedule, Team and FAQs all leave
   the landing page for pages of their own. FAQs used to be #faq, the section
   in the scroll; that section is still there and still answers the common
   ones, but the nav should reach the whole set rather than a sample of it.

   TO WIRE UP: give the schedule and the team a section with an id (or a page)
   and add the href here — nothing else has to change. */
const LINKS: { label: string; href?: string }[] = [
  { label: "Speaker", href: "/speakers" },
  { label: "Schedule", href: "/schedule" },
  { label: "Team", href: "/team" },
  { label: "FAQs", href: "/faqs" },
];

export function HeroNav() {
  // The desktop reference has no menu state at all. The toggle only exists
  // below the breakpoint where the four links stop fitting inside the bar.
  const [open, setOpen] = useState(false);
  // So the link to the page you are already on says so, rather than looking
  // like somewhere else to go.
  const here = usePathname();
  const nav = useRef<HTMLElement>(null);

  /* Below the breakpoint the open menu is a sheet over the whole viewport, so
     the page beneath it has to stop behaving as though it were still there:
     it must not scroll, Escape must dismiss it, and Tab must not walk off into
     content the sheet is covering. Above the breakpoint none of that applies —
     the menu is back to being a row inside the bar — so crossing the
     breakpoint closes it and releases the lock with it. */
  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const overflow = root.style.overflow;
    const padding = root.style.paddingRight;
    // Taking the scrollbar away shifts the layout under the sheet; hold the
    // width it occupied so nothing moves as the menu opens.
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;

    const wide = window.matchMedia("(min-width: 900px)");
    const onWide = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = nav.current?.querySelectorAll<HTMLElement>(
        "a[href], button",
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    wide.addEventListener("change", onWide);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      root.style.overflow = overflow;
      root.style.paddingRight = padding;
      wide.removeEventListener("change", onWide);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <nav className="hero-nav" aria-label="Primary" ref={nav}>
      <a className="hero-nav__brand" href="/">
        <DevFestLogo className="hero-nav__logo" />
      </a>

      {/* Outside the menu on purpose. Below 900px the menu becomes a sheet
          over the whole viewport, so anything inside it is unreachable until
          the hamburger has been pressed — and the light switch has to be in
          the bar at every width, next to the hamburger rather than behind it.
          It rides above the sheet with the logo, so the hero can be switched
          with the menu open. */}
      <HeroTheme />

      <button
        type="button"
        className="hero-nav__toggle"
        aria-expanded={open}
        aria-controls="hero-nav-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="visually-hidden">
          {open ? "Close menu" : "Open menu"}
        </span>
        {/* Three bars rather than one span with two pseudo-elements: the open
            state moves each of them separately, so each needs to be a real box
            the stylesheet can address. */}
        <span className="hero-nav__toggle-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div
        id="hero-nav-menu"
        className="hero-nav__menu"
        data-open={open || undefined}
      >
        <ul className="hero-nav__links">
          {LINKS.map((link, index) => (
            /* `--i` is the row's place in the queue. The stagger is spelt out
               in CSS in terms of it, so a fifth link needs nothing here but a
               fifth entry in LINKS. */
            <li key={link.label} style={{ "--i": index } as CSSProperties}>
              {link.href ? (
                <a
                  href={link.href}
                  aria-current={link.href === here ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <span className="hero-nav__pending">{link.label}</span>
              )}
            </li>
          ))}
        </ul>

        {/* Ticketing lives on its own host, so this leaves the site. It was a
            button while there was nowhere to send anyone; now that there is,
            it is a link, and behaves like one. */}
        <a
          className="hero-nav__ticket"
          href={TICKETS}
          style={{ "--i": LINKS.length } as CSSProperties}
        >
          Buy Ticket
        </a>
      </div>
    </nav>
  );
}
