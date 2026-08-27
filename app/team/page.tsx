import type { Metadata } from "next";
import { HeroNav } from "../hero/HeroNav";
import { SpeakerGrid } from "../speakers/SpeakerGrid";
import { Sponsors } from "../sponsors/Sponsors";
import { SiteFooter } from "../footer/SiteFooter";
import { HEADCOUNT, SQUADS } from "./roster";
import "../hero/Hero.css";
import "../shell/Page.css";
import "../speakers/SpeakerGrid.css";
import "./Team.css";

/* The people who put it on.
 *
 * "Team" has been in the nav since the nav was written and has never gone
 * anywhere. This is where it goes: on the cream, alongside /speakers,
 * /schedule and /faqs, and drawn with the same card the lineup uses, because a
 * volunteer and a speaker are both a face and a name and there is no reason
 * for the site to have two ways of saying that.
 *
 * It is split by squad rather than laid out as one long grid. A DevFest is put
 * on by several teams doing quite different jobs, and "who do I talk to about
 * the schedule" is the actual question this page gets asked.
 */

export const metadata: Metadata = {
  title: "Team — DevFest Lagos",
  description:
    "The volunteers who put DevFest Lagos 2026 on: organising, programme, design and media, community and partnerships.",
};

export default function TeamPage() {
  return (
    <>
      <div className="site-chrome">
        <div className="hero__shell">
          <HeroNav />
        </div>
      </div>

      <section className="leaf" aria-labelledby="team-title">
        <div className="leaf__intro">
          <h1 className="leaf__title" id="team-title">
            The people behind it
          </h1>
          <p className="leaf__lede">
            {HEADCOUNT
              ? `DevFest Lagos is put on by ${HEADCOUNT} volunteers, in four teams. None of them are paid for it.`
              : "DevFest Lagos is put on by volunteers, and none of them are paid for it."}
          </p>
        </div>

        {SQUADS.length ? (
          SQUADS.map((squad) => (
            <section
              className="squad"
              key={squad.name}
              aria-labelledby={`squad-${squad.name.replace(/\s+/g, "-")}`}
            >
              <div className="squad__head" data-reveal data-rise>
                <h2
                  className="squad__name"
                  id={`squad-${squad.name.replace(/\s+/g, "-")}`}
                >
                  {squad.name}
                </h2>
                {squad.blurb && <p className="squad__blurb">{squad.blurb}</p>}
              </div>

              {/* The same grid the lineup is drawn with — see roster.ts for why
                  a team member is widened into a speaker to get here. */}
              <SpeakerGrid speakers={squad.people} />
            </section>
          ))
        ) : (
          <p className="leaf__intro squad--none">
            The team for 2026 is being put together, and everyone will be named
            here once it is.
          </p>
        )}
      </section>

      <Sponsors />
      <SiteFooter />
    </>
  );
}
