import Link from "next/link";
import { getLineup } from "./lineup";
import { SpeakerDays } from "./SpeakerDays";
import "./Speakers.css";

/* The lineup on the landing page: the wall of cards, day by day.
 *
 * A ring is a good way to offer a taste of who is coming and a bad way to find
 * someone among fifty, so it does the first job and hands the second to
 * /speakers. The link below it is not decoration — without it that page is
 * reachable only from the nav, and people do not look there. */

export async function SpeakersSection() {
  const { days } = await getLineup();
  const total = days.reduce((sum, day) => sum + day.speakers.length, 0);

  return (
    <section className="speakers" id="speakers" aria-labelledby="speakers-title">
      <div className="speakers__intro" data-reveal>
        <h2 className="speakers__title" id="speakers-title" data-rise>
          Meet Our Speakers
        </h2>
        <p className="speakers__lede" data-rise>
          We&rsquo;ve raised the bar this year with our impressive lineup of
          speakers, each prepared to share valuable insights across both days.
        </p>
      </div>

      <SpeakerDays days={days} />

      <div className="speakers__more" data-reveal data-rise>
        {/* The count is in the label because it is the reason to follow it. */}
        <Link className="speakers__all" href="/speakers">
          See all {total} speakers
        </Link>
      </div>
    </section>
  );
}
