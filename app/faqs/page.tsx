import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroNav } from "../hero/HeroNav";
import { FaqBoard } from "../faq/FaqBoard";
import { Sponsors } from "../sponsors/Sponsors";
import { SiteFooter } from "../footer/SiteFooter";
import "../hero/Hero.css";
import "../shell/Page.css";
import "./Faqs.css";

/* Every question, on its own page.
 *
 * The landing page answers what someone asks while they are still deciding
 * whether to come. This is where the rest live — the conduct guidelines, the
 * call for papers, what time the doors open — and it is a page rather than a
 * longer section because it is a reference: something to link to, search, and
 * send to one person who asked one thing.
 *
 * It is the same board the section uses, on the cream, which is the ground the
 * other standalone pages sit on. See Faqs.css.
 */

export const metadata: Metadata = {
  title: "FAQs — DevFest Lagos",
  description:
    "Everything about DevFest Lagos 2026: tickets, registration, what a ticket covers, the conduct guidelines and speaking at the event.",
};

export default function FaqsPage() {
  return (
    <>
      <div className="site-chrome">
        <div className="hero__shell">
          <HeroNav />
        </div>
      </div>

      <section className="leaf faqs" aria-labelledby="faqs-title">
        <div className="leaf__intro">
          <h1 className="leaf__title" id="faqs-title">
            Frequently asked questions
          </h1>
          <p className="leaf__lede">
            Tickets, the two days themselves, and what to expect when you get
            there. If something is not answered here, ask us and it will be.
          </p>
        </div>

        {/* The board reads ?q= from the URL, which a statically prerendered
            page has to reach through a Suspense boundary. */}
        <Suspense>
          <FaqBoard clearHref="/faqs" />
        </Suspense>
      </section>

      <Sponsors />
      <SiteFooter />
    </>
  );
}
