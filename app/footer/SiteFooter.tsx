import { DevFestIcon } from "../hero/DevFestIcon";
import "./SiteFooter.css";

/* `href` is optional, and most of these do not have one yet. They all used to
   point at anchors — #schedule, #team, #x, #app — none of which exist anywhere
   in the markup, so every link in this footer was dead. An entry without a
   destination renders as plain text rather than as a link that does nothing.

   TO WIRE UP:
     · Schedule, Join Community, Team — need sections or pages.
     · The five socials — need the real profile URLs. Deliberately not guessed:
       sending people to the wrong account is worse than not linking yet.
     · Download App, Play Game, DP Generator, Buy Tickets — need destinations. */
const COLUMNS: {
  heading: string;
  links: { label: string; href?: string }[];
}[] = [
  {
    heading: "Devfest",
    links: [
      { label: "Schedule" },
      { label: "Speakers", href: "#speakers" },
      { label: "FAQs", href: "#faq" },
      { label: "Join Community" },
      { label: "Team" },
    ],
  },
  {
    heading: "Contact Us",
    links: [
      { label: "X" },
      { label: "Linkedin" },
      { label: "Instagram" },
      { label: "Facebook" },
      { label: "Youtube" },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Download Devfest App" },
      { label: "Play Game" },
      { label: "DP Generator" },
      { label: "Buy Tickets" },
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
      <div className="foot__mark" aria-hidden="true">
        <DevFestIcon className="foot__icon" />
        <span className="foot__word">
          Devfest
          <span className="foot__city">Lagos</span>
        </span>
      </div>

      <div className="foot__panel">
        <div className="foot__grid">
          <div className="foot__signup">
            <h2 className="foot__heading">Don&rsquo;t Miss out on Information</h2>
            <p className="foot__sub">Enter your email for news and updates</p>

            <form className="foot__form" action="#" method="post">
              <label className="visually-hidden" htmlFor="foot-email">
                Email address
              </label>
              <input
                id="foot-email"
                className="foot__input"
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
              <button type="submit" className="foot__submit">
                <span className="visually-hidden">Subscribe</span>
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
                  <path d="M13 1l6 6-6 6M19 7H1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} className="foot__col" aria-label={col.heading}>
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

        <p className="foot__legal">
          &copy; 2026 Devfest Lagos. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
