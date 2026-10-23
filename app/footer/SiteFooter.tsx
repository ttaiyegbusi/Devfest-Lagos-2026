import { DevFestLogo } from "../hero/DevFestLogo";
import { LandmarkScene } from "./LandmarkScene";
import { Sponsors } from "../sponsors/Sponsors";
import "./SiteFooter.css";
import { SOCIALS, TICKETS } from "../links";

const COLUMNS: {
  heading: string;
  links: { label: string; href?: string }[];
}[] = [
  {
    heading: "Links",
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
];

export function SiteFooter() {
  return (
    <footer className="foot">
      <Sponsors />

      <div className="foot__body">
        <div className="foot__brand" data-reveal>
          <DevFestLogo className="foot__logo" />
          <p className="foot__tagline" data-rise>
            Join the largest annual tech conference in Africa, hosted by Google
            Developer Group Lagos (GDG Lagos).
          </p>
          <a href={TICKETS} className="foot__cta" data-rise>
            Buy Ticket
          </a>
        </div>

        <div className="foot__columns" data-reveal>
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
      </div>

      <div className="foot__scene" aria-hidden="true">
        <LandmarkScene className="foot__landmark" />
      </div>
    </footer>
  );
}
