import { DevFestIcon } from "../hero/DevFestIcon";
import { SignupForm } from "./SignupForm";
import "./SiteFooter.css";
import { SOCIALS, TICKETS } from "../links";

/* `href` is optional, and most of these do not have one yet. They all used to
   point at anchors — #schedule, #team, #x, #app — none of which exist anywhere
   in the markup, so every link in this footer was dead. An entry without a
   destination renders as plain text rather than as a link that does nothing.

   TO WIRE UP:
     · Play Game — needs a destination. */
const COLUMNS: {
  heading: string;
  links: { label: string; href?: string }[];
}[] = [
  {
    heading: "Devfest",
    links: [
      { label: "Schedule", href: "/schedule" },
      { label: "Speakers", href: "/speakers" },
      { label: "FAQs", href: "/faqs" },
      { label: "Join Community", href: "https://gdg.community.dev/gdg-lagos/" },
      { label: "Team", href: "/team" },
    ],
  },
  {
    heading: "Contact Us",
    links: [
      { label: "X", href: SOCIALS.X },
      { label: "Linkedin", href: SOCIALS.Linkedin },
      { label: "Instagram", href: SOCIALS.Instagram },
      { label: "Facebook", href: SOCIALS.Facebook },
      { label: "Youtube", href: SOCIALS.Youtube },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Download Devfest App", href: "https://apps.apple.com/ng/app/devfest-lagos-2024/id6737826901" },
      { label: "Play Game" },
      { label: "DP Generator", href: "https://devfestlagos.com/dp-generator" },
      { label: "Buy Tickets", href: TICKETS },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="foot__panel">
        <div className="foot__grid" data-reveal>
          {/* Left section: Branding and CTA */}
          <div className="foot__brand-section" data-rise>
            <div className="foot__brand-header">
              <DevFestIcon className="foot__brand-icon" />
              <span className="foot__brand-text">DevFest Lagos</span>
            </div>
            <p className="foot__brand-desc">
              Join the largest annual tech conference in Africa, hosted by Google Developer Group Lagos (GDG Lagos).
            </p>
            <a href={TICKETS} className="foot__brand-cta">
              Buy Ticket
            </a>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav
              key={col.heading}
              className="foot__col"
              aria-label={col.heading}
              data-rise
            >
              <h3 className="foot__colhead">{col.heading}</h3>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href}>{link.label}</a>
                    ) : (
                      <span className="foot__pending">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="foot__legal" data-reveal data-rise>
          &copy; 2026 Devfest Lagos. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
