import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroNav } from "../hero/HeroNav";
import { Faq } from "../faq/Faq";
import { Sponsors } from "../sponsors/Sponsors";
import { SiteFooter } from "../footer/SiteFooter";
import { getLineup } from "./lineup";
import { SpeakerViews } from "./SpeakerViews";
import "../hero/Hero.css";
import "../shell/Page.css";
import "./SpeakerGrid.css";

/* The full lineup, on its own page.
 *
 * The landing page carries the wall of cards — a taste of who is coming, on
 * the dark. This is where someone goes to find a name, so it is a grid, and it
 * is on the cream: the same ground as /schedule, because the two pages are the
 * same kind of thing and should not look like they came from different sites.
 *
 * Below the lineup the page carries the landing page's own tail, in the same
 * order: the questions, then who paid for it, then the footer. Someone who
 * arrived here from a shared link has seen none of that, and a page that ends
 * at the last speaker leaves them with nowhere to go and nothing else to read.
 */

export const metadata: Metadata = {
  title: "Speakers — DevFest Lagos",
  description:
    "The full DevFest Lagos 2026 lineup, day by day: who is speaking, what they do, and where they do it.",
};

export default async function SpeakersPage() {
  const { days } = await getLineup();
  const total = days.reduce((sum, day) => sum + day.speakers.length, 0);

  return (
    <>
      <div className="site-chrome">
        <div className="hero__shell">
          <HeroNav />
        </div>
      </div>

      <section className="leaf" aria-labelledby="lineup-title">
        <div className="leaf__intro">
          <h1 className="leaf__title" id="lineup-title">
            The full lineup
          </h1>
          <p className="leaf__lede">
            {total} speakers across two days. Names and roles are confirmed as
            they are announced.
          </p>
        </div>

        <SpeakerViews days={days} />
      </section>

      {/* The FAQ reads ?q= from the URL, which a statically prerendered page
          has to reach through a Suspense boundary. */}
      <Suspense>
        <Faq />
      </Suspense>
      <Sponsors />
      <SiteFooter />
    </>
  );
}
