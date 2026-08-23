"use client";

import { useState } from "react";
import { DevFestLogo } from "./DevFestLogo";

/* `href` is deliberately optional. Every one of these used to point at an
   anchor — #about, #pricing, #community-board — and not one of those ids
   existed anywhere in the markup, so the whole nav was dead: clicking did
   nothing at all. A link that goes nowhere is worse than plain text, so an
   entry without a destination renders as text until it has one.

   TO WIRE UP: "Community Board" and "Pricing" need a section or a page. Give
   the section an id and put it here. */
const LINKS: { label: string; href?: string }[] = [
  { label: "About", href: "#about" },
  { label: "Community Board" },
  { label: "Pricing" },
  { label: "FAQ", href: "#faq" },
];

export function HeroNav() {
  // The desktop reference has no menu state at all. The toggle only exists
  // below the breakpoint where the four links stop fitting inside the bar.
  const [open, setOpen] = useState(false);

  return (
    <nav className="hero-nav" aria-label="Primary">
      <a className="hero-nav__brand" href="/">
        <DevFestLogo className="hero-nav__logo" />
      </a>

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
        <span className="hero-nav__toggle-bars" aria-hidden="true" />
      </button>

      <div
        id="hero-nav-menu"
        className="hero-nav__menu"
        data-open={open || undefined}
      >
        <ul className="hero-nav__links">
          {LINKS.map((link) => (
            <li key={link.label}>
              {link.href ? (
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              ) : (
                <span className="hero-nav__pending">{link.label}</span>
              )}
            </li>
          ))}
        </ul>

        {/* No ticketing destination yet. Rendered as a button rather than a
            link so it is not a link to nowhere; point it at the real ticket
            page (or handler) when there is one. */}
        <button type="button" className="hero-nav__ticket">
          Buy Ticket
        </button>
      </div>
    </nav>
  );
}
