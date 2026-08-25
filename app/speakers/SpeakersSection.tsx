import { getLineup } from "./lineup";
import { SpeakerDays } from "./SpeakerDays";
import "./Speakers.css";

/* The section itself is rendered on the server, which is what lets the lineup
 * come from a spreadsheet: the fetch happens here, the reader gets finished
 * markup, and search engines and share cards see the real names. Only the day
 * tabs and the wall below them are interactive, and they take the data as
 * props. */

export async function SpeakersSection() {
  const { days } = await getLineup();

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
    </section>
  );
}
