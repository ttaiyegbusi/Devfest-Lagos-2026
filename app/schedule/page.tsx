import type { Metadata } from "next";
import { HeroNav } from "../hero/HeroNav";
import { SiteFooter } from "../footer/SiteFooter";
import { getAgenda } from "./agenda";
import { ScheduleViews } from "./ScheduleViews";
import "../hero/Hero.css";
import "../shell/Page.css";
import "./Schedule.css";

/* The schedule, on its own page.
 *
 * It used to be a section on the landing page. Two days of sessions is a
 * reference you come back to and read against the clock, not something you
 * scroll past on the way to the ticket price — so it lives where it can be
 * linked to, bookmarked and opened on the morning. */

export const metadata: Metadata = {
  title: "Schedule — DevFest Lagos",
  description:
    "Two days of DevFest Lagos 2026, session by session: times, tracks and who is speaking.",
};

export default async function SchedulePage() {
  const { days } = await getAgenda();

  return (
    <>
      <div className="site-chrome">
        <div className="hero__shell">
          <HeroNav />
        </div>
      </div>

      <section className="leaf" aria-labelledby="schedule-title">
        <div className="leaf__intro">
          <h1 className="leaf__title" id="schedule-title">
            Two days, start to finish
          </h1>
          <p className="leaf__lede">
            Times are provisional until the week of the event. Every ticket
            covers the after party.
          </p>
        </div>

        <div className="schedule">
          <ScheduleViews days={days} />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
