import { DevFestLogo } from "../hero/DevFestLogo";
import "./SiteFooter.css";

const COLUMNS = [
  {
    heading: "Devfest",
    links: [
      ["Schedule", "#schedule"],
      ["Speakers", "#speakers"],
      ["FAQs", "#faq"],
      ["Join Community", "#community"],
      ["Team", "#team"],
    ],
  },
  {
    heading: "Contact Us",
    links: [
      ["X", "#x"],
      ["Linkedin", "#linkedin"],
      ["Instagram", "#instagram"],
      ["Facebook", "#facebook"],
      ["Youtube", "#youtube"],
    ],
  },
  {
    heading: "Product",
    links: [
      ["Download Devfest App", "#app"],
      ["Play Game", "#game"],
      ["DP Generator", "#dp"],
      ["Buy Tickets", "#tickets"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="foot">
      {/* Oversized watermark behind the panel. Decorative, so it is hidden from
          assistive tech — the same words are already in the nav and the panel. */}
      <div className="foot__mark" aria-hidden="true">
        <DevFestLogo className="foot__glyph" />
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
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
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
