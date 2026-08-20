"use client";

import { useState } from "react";
import { DevFestLogo } from "./DevFestLogo";

const LINKS = [
  { label: "About", href: "#about" },
  { label: "Community Board", href: "#community-board" },
  { label: "Pricing", href: "#pricing" },
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
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          className="hero-nav__ticket"
          href="#tickets"
          onClick={() => setOpen(false)}
        >
          Buy Ticket
        </a>
      </div>
    </nav>
  );
}
