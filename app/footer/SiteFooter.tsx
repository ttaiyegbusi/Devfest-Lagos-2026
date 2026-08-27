import { DevFestIcon } from "../hero/DevFestIcon";
import { SignupForm } from "./SignupForm";
import "./SiteFooter.css";
import { SOCIALS, TICKETS } from "../links";

/* `href` is optional, and most of these do not have one yet. They all used to
   point at anchors — #schedule, #team, #x, #app — none of which exist anywhere
   in the markup, so every link in this footer was dead. An entry without a
   destination renders as plain text rather than as a link that does nothing.

   TO WIRE UP:
     · Join Community — needs the GDG Lagos chapter URL.
     · Facebook — needs the real profile URL. Deliberately not guessed:
       sending people to the wrong account is worse than not linking yet. The
       other four are in app/links.ts.
     · Download App, Play Game, DP Generator — need destinations. */
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
      { label: "Join Community" },
      { label: "Team", href: "/team" },
    ],
  },
  {
    heading: "Contact Us",
    links: [
      { label: "X", href: SOCIALS.X },
      { label: "Linkedin", href: SOCIALS.Linkedin },
      { label: "Instagram", href: SOCIALS.Instagram },
      { label: "Facebook" },
      { label: "Youtube", href: SOCIALS.Youtube },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Download Devfest App" },
      { label: "Play Game" },
      { label: "DP Generator" },
      { label: "Buy Tickets", href: TICKETS },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="foot">
      {/* Oversized watermark behind the panel. Decorative, so it is hidden from
          assistive tech — the same words are already in the nav and the panel.

          The wordmark is set as type rather than taken from the official lockup
          SVG. The lockup runs "DevFest Lagos" along one line in its own
          lettering; the design sets it in the display face and lifts "Lagos"
          above the tail of "Devfest", which is not an arrangement the supplied
          asset can be bent into. */}
      <div className="foot__mark" aria-hidden="true" data-reveal data-rise="still">
        <DevFestIcon className="foot__icon" />
        <span className="foot__word">
          Devfest
          <span className="foot__city">Lagos</span>
        </span>
      </div>

      <div className="foot__panel">
        <div className="foot__grid" data-reveal>
          <div className="foot__signup">
            <h2 className="foot__heading" data-rise>
              Don&rsquo;t Miss out on Information
            </h2>
            <p className="foot__sub" data-rise>
              Enter your email for news and updates
            </p>

            <SignupForm />
          </div>

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
