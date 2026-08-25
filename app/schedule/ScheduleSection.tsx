import { getAgenda } from "./agenda";
import { ScheduleViews } from "./ScheduleViews";
import "./Schedule.css";

/* Loaded on the server, like the speaker lineup, so the schedule is in the
 * markup rather than fetched after paint. Only the day tabs and the choice of
 * view are interactive. */

export async function ScheduleSection() {
  const { days } = await getAgenda();

  return (
    <section className="schedule" id="schedule" aria-labelledby="schedule-title">
      <div className="schedule__intro" data-reveal>
        <h2 className="schedule__title" id="schedule-title" data-rise>
          Two days, start to finish
        </h2>
        <p className="schedule__lede" data-rise>
          Times are provisional until the week of the event. Every ticket covers
          the after party.
        </p>
      </div>

      <ScheduleViews days={days} />
    </section>
  );
}
