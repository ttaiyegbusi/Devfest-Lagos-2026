import type { Metadata } from "next";
import Link from "next/link";
import { HeroNav } from "../hero/HeroNav";
import { SiteFooter } from "../footer/SiteFooter";
import { getLineup } from "./lineup";
import { SpeakerDays } from "./SpeakerDays";
import "../hero/Hero.css";
import "./Speakers.css";

/* The full lineup, on its own page.
 *
 * The landing page carries the wall of cards — a taste of who is coming. This
 * is where someone goes to find a name, so it is a grid: everyone at once, at
 * whatever length the lineup runs to.
 *
 * It wears the site's own nav bar rather than a header of its own, so leaving
 * is the same gesture here as it is anywhere else on the site. */

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

      <section className="speakers" aria-labelledby="lineup-title">
        <div className="speakers__intro" data-reveal>
          <p className="speakers__back" data-rise>
            <Link href="/">&larr; DevFest Lagos 2026</Link>
          </p>
          <h1 className="speakers__title" id="lineup-title" data-rise>
            The full lineup
          </h1>
          <p className="speakers__lede" data-rise>
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
