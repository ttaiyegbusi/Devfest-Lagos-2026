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
        {/* Numbered here rather than by app/motion/Reveal.tsx: this section is
            behind a Suspense boundary, and a stamp applied before React hydrates
            it reads as a hydration mismatch. See the note in Reveal.tsx. */}
        <h2
          className="faq__title"
          id="faq-title"
          data-rise
          style={{ ["--rise-i" as string]: 0 }}
        >
          Frequently asked questions
        </h2>
        <p className="faq__lede" data-rise style={{ ["--rise-i" as string]: 1 }}>
          All your questions answered
        </p>
      </div>

      <FaqBoard clearHref="/#faq" />

      <div className="faq__more" data-reveal data-rise style={{ ["--rise-i" as string]: 0 }}>
        {/* The count is in the label because it is the reason to follow it. */}
        <Link className="faq__all" href="/faqs">
          Read all {FAQS.length} questions
        </Link>
      </div>
    </section>
  );
}
