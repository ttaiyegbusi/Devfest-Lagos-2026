import type { Metadata } from "next";
import Link from "next/link";
import { HeroNav } from "../hero/HeroNav";
import { SiteFooter } from "../footer/SiteFooter";
import { getLineup } from "./lineup";
import { SpeakerDays } from "./SpeakerDays";
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
 * It wears the site's own nav bar, so leaving is the same gesture here as it
 * is anywhere else. */

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
          <p className="leaf__back">
            <Link href="/">&larr; DevFest Lagos 2026</Link>
          </p>
          <h1 className="leaf__title" id="lineup-title">
            The full lineup
          </h1>
          <p className="leaf__lede">
            {total} speakers across two days. Names and roles are confirmed as
            they are announced.
          </p>
        </div>

        <SpeakerDays days={days} variant="grid" />
      </section>

      <SiteFooter />
    </>
  );
}
