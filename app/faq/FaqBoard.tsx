"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FAQS, GROUPS } from "./questions";
/* The same matcher the hero's ask panel uses. Two copies would drift the first
   time either was tuned, and "the FAQ found it but the panel did not" is a bug
   nobody would think to look for. */
import { matches } from "./search";
import "./Faq.css";

/* The rail and the questions, on two grounds.
 *
 * The landing page carries this on the dark, as a section; /faqs carries it on
 * the cream, as the page. Every colour comes from a --faq-* property the
 * surrounding element sets, so this is one component rather than two that
 * would have drifted — see Faq.css.
 *
 * `clearHref` is where "Show all questions" goes when a search from the hero
 * has been applied. It differs per host: back to the section on the landing
 * page, back to the page itself on /faqs.
 */
export function FaqBoard({ clearHref }: { clearHref: string }) {
  const [group, setGroup] = useState<string>("All");
  const [open, setOpen] = useState<string | null>(null);
  const id = useId();
  const router = useRouter();

  /* The hero's search box sends its question here as ?q=. Reading it from the
     URL rather than from shared state means the result is linkable, survives a
     reload, and needs no wiring between two sections of the page. */
  const query = (useSearchParams().get("q") ?? "").trim();

  const shown = query
    ? FAQS.filter((f) => matches(`${f.q} ${f.a}`, query))
    : FAQS.filter((f) => group === "All" || f.group === group);

  // The list reserves the height of the longest category so switching filters
  // swaps the questions without the section growing or shrinking under the
  // pointer. "All" is always the longest, but derive it rather than assume.
  const tallest = Math.max(
    FAQS.length,
    ...GROUPS.map((g) => FAQS.filter((f) => f.group === g).length),
  );

  return (
    <div className="faq__body" data-reveal>
      {query ? (
        <p className="faq__search" role="status">
          {shown.length
            ? `${shown.length} ${shown.length === 1 ? "answer" : "answers"} for “${query}”`
            : `Nothing here answers “${query}” yet.`}{" "}
          <button
            type="button"
            className="faq__clear"
            onClick={() => {
              router.push(clearHref);
              setOpen(null);
            }}
          >
            Show all questions
          </button>
        </p>
      ) : null}

      <nav
        className="faq__groups"
        aria-label="Filter questions"
        hidden={!!query}
        data-rise
      >
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            className="faq__group"
            data-active={g === group || undefined}
            aria-pressed={g === group}
            onClick={() => {
              setGroup(g);
              setOpen(null);
            }}
          >
            {g}
          </button>
        ))}
      </nav>

      <ul className="faq__list" style={{ ["--rows" as string]: tallest }}>
        {shown.map((f) => {
          const isOpen = open === f.q;
          return (
            <li key={f.q} className="faq__item" data-rise>
              <h3 className="faq__q">
                <button
                  type="button"
                  className="faq__trigger"
                  aria-expanded={isOpen}
                  aria-controls={`${id}-${f.q.length}-${f.q.slice(0, 8)}`}
                  onClick={() => setOpen(isOpen ? null : f.q)}
                >
                  <span>{f.q}</span>
                  <span
                    className="faq__sign"
                    data-open={isOpen || undefined}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <div
                className="faq__a"
                id={`${id}-${f.q.length}-${f.q.slice(0, 8)}`}
                hidden={!isOpen}
              >
                <p>{f.a}</p>
                {f.link && (
                  <p className="faq__link">
                    {/* Leaves the site — Google's guidelines are not ours to
                        restate, and a paraphrase of a conduct policy is worse
                        than the policy. */}
                    <a
                      href={f.link.href}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={isOpen ? undefined : -1}
                    >
                      {f.link.label}
                    </a>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
