import Link from "next/link";
import { FaqBoard } from "./FaqBoard";
import { FAQS } from "./questions";
import "./Faq.css";

/* The FAQ as a section, on the dark.
 *
 * It answers the questions someone has while they are still deciding, which is
 * why it sits where it does in the scroll. The rest of them — the conduct
 * guidelines, the call for papers, what time the doors open — are on /faqs,
 * and the link below is how anyone reading this gets there. Without it that
 * page is reachable only from the nav, and people do not look there.
 */
export function Faq() {
  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="faq__intro" data-reveal>
        <h2 className="faq__title" id="faq-title" data-rise>
          Frequently asked questions
        </h2>
        <p className="faq__lede" data-rise>
          All your questions answered
        </p>
      </div>

      <FaqBoard clearHref="/#faq" />

      <div className="faq__more" data-reveal data-rise>
        {/* The count is in the label because it is the reason to follow it. */}
        <Link className="faq__all" href="/faqs">
          Read all {FAQS.length} questions
        </Link>
      </div>
    </section>
  );
}
