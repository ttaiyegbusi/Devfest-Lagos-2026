"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FAQS, GROUPS } from "./questions";
import "./Faq.css";

/** Every word of the query has to appear somewhere in the entry. Naive, and
 *  right for seven questions: no index, no ranking, no stemming to get wrong. */
function matches(haystack: string, query: string) {
  const hay = haystack.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

export function Faq() {
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
    <section className="faq" id="faq" aria-labelledby={`${id}-title`}>
      <div className="faq__intro">
        <h2 className="faq__title" id={`${id}-title`}>
          Frequently asked questions
        </h2>
        <p className="faq__lede">All your questions answered</p>
      </div>

      <div className="faq__body">
        {query ? (
          <p className="faq__search" role="status">
            {shown.length
              ? `${shown.length} ${shown.length === 1 ? "answer" : "answers"} for \u201c${query}\u201d`
              : `Nothing here answers \u201c${query}\u201d yet.`}{" "}
            <button
              type="button"
              className="faq__clear"
              onClick={() => {
                router.push("/#faq");
                setOpen(null);
              }}
            >
              Show all questions
            </button>
          </p>
        ) : null}

        <nav className="faq__groups" aria-label="Filter questions" hidden={!!query}>
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
              <li key={f.q} className="faq__item">
                <h3 className="faq__q">
                  <button
                    type="button"
                    className="faq__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-${f.q.length}-${f.q.slice(0, 8)}`}
                    onClick={() => setOpen(isOpen ? null : f.q)}
                  >
                    <span>{f.q}</span>
                    <span className="faq__sign" data-open={isOpen || undefined} aria-hidden="true" />
                  </button>
                </h3>
                <div
                  className="faq__a"
                  id={`${id}-${f.q.length}-${f.q.slice(0, 8)}`}
                  hidden={!isOpen}
                >
                  <p>{f.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
