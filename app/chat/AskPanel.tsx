"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { answer, staticEntries, type Entry } from "./entry";
import {
  GREETING,
  GREETING_KEYWORDS,
  GREETING_RESPONSE,
  NO_ANSWER,
  PANEL_NAME,
  STARTERS,
  askOnX,
} from "./starters";
import "./Ask.css";

/* The ask panel. One of them, rendered by AskProvider and opened from the
 * hero or from the floating button.
 *
 * PORTALLED TO document.body ON PURPOSE. The hero is a layer of the pinned
 * stack, and `.stack__slab` carries a rotate/scale — a transformed ancestor
 * makes `position: fixed` resolve against that ancestor instead of the
 * viewport, so a panel rendered in place would be pinned to the hero slab and
 * would slide away with it the moment the next panel climbed over. It looks
 * right until you scroll, which is the worst kind of wrong.
 *
 * It looks things up; it does not compose anything. Every answer is an entry
 * built from the data a page of this site is drawn from — the FAQ, the
 * tickets, the schedule, the lineup (see knowledge.ts) — found by the same
 * ranking the FAQ section uses. So the empty state says where the answers come
 * from, and a question nothing answers is sent to the people who can answer
 * it, on X, rather than answered with a guess. */

type Exchange = {
  id: number;
  question: string;
  hits: Entry[];
  greeting?: { heading: string; note: string };
};

/* The FAQ and the tickets, which are in the bundle. What the panel searches
   until the rest arrives, and what it keeps searching if the rest never does. */
const BUNDLED = staticEntries();

const isExternal = (href: string) => /^https?:/.test(href);

export function AskPanel({
  open,
  onClose,
  returnTo,
}: {
  open: boolean;
  onClose: () => void;
  returnTo: React.RefObject<HTMLElement | null>;
}) {
  const id = useId();
  const [mounted, setMounted] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [phone, setPhone] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const next = useRef(0);

  /* The schedule and the lineup come from the server, once, the first time
     the panel is opened — not on page load, since most visitors never open it.
     A failed request is forgotten rather than remembered, so the next question
     tries again. */
  const [entries, setEntries] = useState<Entry[]>(BUNDLED);
  const pending = useRef<Promise<Entry[]> | null>(null);
  const load = useCallback(() => {
    pending.current ??= fetch("/api/ask/knowledge")
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status}`);
        return response.json() as Promise<Entry[]>;
      })
      .then((found) => {
        setEntries(found);
        return found;
      })
      .catch(() => {
        pending.current = null;
        return BUNDLED;
      });
    return pending.current;
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => setMounted(true), []);

  /* Full screen below the breakpoint, a column beside the page above it — and
     that is not only width. Full screen it covers the page, so it takes the
     page's behaviour with it: nothing scrolls behind it and Tab cannot leave.
     Beside the page it covers nothing, so the page keeps working and trapping
     focus in it would be wrong. */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const read = () => setPhone(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const padding = root.style.paddingRight;

    if (phone) {
      const bar = window.innerWidth - root.clientWidth;
      root.style.overflow = "hidden";
      if (bar > 0) root.style.paddingRight = `${bar}px`;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !phone) return;
      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input, [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      root.style.overflow = overflow;
      root.style.paddingRight = padding;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, phone, onClose]);

  const opened = useRef(false);

  /* Closing hands focus back to the control it was opened from, rather than
     dropping it at the top of the document — but only after a real close.
     Without the guard this runs on the very first render, where `open` is
     already false, and steals focus to the hero's ask button the moment the
     page hydrates.

     Opening is not symmetric. With a mouse the caret goes where the reader is
     about to type. On a phone the panel is the whole screen and the keyboard
     would cover the suggestions the empty state exists to offer, so focus goes
     to the panel itself: the dialog is still announced and Escape still works,
     and the keyboard waits until the field is actually tapped. The width is
     read here rather than taken from state so this depends on `open` alone and
     cannot refocus on a resize. */
  useEffect(() => {
    if (!open) {
      if (opened.current) returnTo.current?.focus();
      return;
    }
    opened.current = true;
    if (window.matchMedia("(max-width: 899px)").matches) panel.current?.focus();
    else input.current?.focus();
    // `returnTo` is a ref and never changes identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isGreeting = (text: string): boolean => {
    const lowerText = text.toLowerCase().trim();
    return GREETING_KEYWORDS.some((keyword) => lowerText === keyword || lowerText.startsWith(keyword + " "));
  };

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q) return;
    if (input.current) input.current.value = "";

    const exchange: Exchange = { id: next.current++, question: q, hits: [] };

    if (isGreeting(q)) {
      exchange.greeting = GREETING_RESPONSE;
    } else {
      // Waits for the full set if it is still on its way: a question about a
      // speaker asked the instant the panel opens should not miss.
      exchange.hits = answer(await load(), q);
    }

    setExchanges((prev) => [...prev, exchange]);
  };

  /* Each new question is brought to the top of the column, not the bottom.
     An answer can be a day's whole schedule, and scrolling to its end would
     show the last session and hide the question that was asked. In an effect,
     so it runs once the answer has been laid out. */
  useEffect(() => {
    const column = log.current;
    const turn = column?.querySelector<HTMLElement>(".ask__turn:last-of-type");
    if (!column || !turn) return;
    column.scrollTop +=
      turn.getBoundingClientRect().top - column.getBoundingClientRect().top - 16;
  }, [exchanges]);

  if (!mounted) return null;

  const empty = exchanges.length === 0;

  return createPortal(
    <div className="ask" data-open={open || undefined} aria-hidden={!open || undefined}>
      {/* Only on the phone, where the panel is a sheet over the page. Beside
          the page there is nothing to dim. */}
      <div className="ask__scrim" onClick={onClose} />

      <div
        className="ask__panel"
        ref={panel}
        /* Focusable so the phone can be given the dialog itself rather than
           its text field — see the focus effect above. */
        tabIndex={-1}
        role="dialog"
        aria-modal={phone || undefined}
        aria-label={PANEL_NAME}
      >
        <div className="ask__bar">
          <p className="ask__name">{PANEL_NAME}</p>
          <div className="ask__tools">
            <button
              type="button"
              className="ask__tool"
              onClick={() => {
                setExchanges([]);
                input.current?.focus();
              }}
              disabled={empty}
            >
              <span className="visually-hidden">Clear the questions</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path
                  d="M13 7.5a5.5 5.5 0 1 1-1.9-4.16M13 1v3.2h-3.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button type="button" className="ask__tool" onClick={onClose}>
              <span className="visually-hidden">Close</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M2 2l11 11M13 2L2 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="ask__log" ref={log} role="log" aria-live="polite">
          {exchanges.map((x, i) => {
            const isLast = i === exchanges.length - 1;
            const asked = new Set(exchanges.map((e) => e.question));
            /* What to ask next: first the neighbours of what was just
               answered — the other ticket questions after a ticket question —
               then whichever starters are still unasked. */
            const group = x.hits[0]?.group;
            const related = group
              ? entries
                  .filter((e) => e.group === group && !x.hits.includes(e))
                  .map((e) => e.q)
              : [];
            const followUps = isLast
              ? [...new Set([...related.slice(0, 2), ...STARTERS])]
                  .filter((s) => !asked.has(s))
                  .slice(0, 3)
              : [];

            return (
              <div className="ask__turn" key={x.id}>
                <p className="ask__question">{x.question}</p>
                {x.greeting ? (
                  <div className="ask__greeting-response">
                    <h3 className="ask__heading">{x.greeting.heading}</h3>
                    <p className="ask__note">{x.greeting.note}</p>
                  </div>
                ) : x.hits.length === 0 ? (
                  <p className="ask__none">
                    {NO_ANSWER.lead}{" "}
                    <a href={askOnX(x.question)} target="_blank" rel="noreferrer">
                      {NO_ANSWER.ask}
                    </a>{" "}
                    {NO_ANSWER.after}
                  </p>
                ) : (
                  x.hits.map((f, n) => (
                    /* By position as well: lunch on each day is two answers
                       with one title. */
                    <div className="ask__answer" key={`${n}-${f.q}`}>
                      <p className="ask__answer-q">{f.q}</p>
                      {/* Empty where the link is the answer: directions. */}
                      {f.a && <p className="ask__answer-a">{f.a}</p>}
                      {f.lines && (
                        <ul className="ask__lines">
                          {f.lines.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      )}
                      {f.links && (
                        <p className="ask__links">
                          {f.links.map((link) =>
                            isExternal(link.href) ? (
                              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                                {link.label}
                              </a>
                            ) : (
                              /* On the phone the panel is the whole screen, so
                                 a link to a page has to get out of that
                                 page's way. Beside the page it can stay. */
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={phone ? onClose : undefined}
                              >
                                {link.label}
                              </Link>
                            )
                          )}
                        </p>
                      )}
                    </div>
                  ))
                )}
                {followUps.length > 0 && (
                  <ul className="ask__starters">
                    {followUps.map((s) => (
                      <li key={s}>
                        <button type="button" className="ask__starter" onClick={() => ask(s)}>
                          <span aria-hidden="true">&#8627;</span> {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {/* The greeting sits at the bottom of the column, above the field it
              is inviting you to use, and is pushed up out of the way by the
              first answer rather than being cleared away. */}
          {empty ? (
            <div className="ask__greeting">
              <h2 className="ask__heading">{GREETING.heading}</h2>
              <p className="ask__note">{GREETING.note}</p>
              <ul className="ask__starters">
                {STARTERS.map((s) => (
                  <li key={s}>
                    <button type="button" className="ask__starter" onClick={() => ask(s)}>
                      <span aria-hidden="true">&#8627;</span> {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <form
          className="ask__form"
          onSubmit={(event) => {
            event.preventDefault();
            ask(input.current?.value ?? "");
          }}
        >
          <label className="visually-hidden" htmlFor={`${id}-q`}>
            Ask about DevFest Lagos
          </label>
          <input
            ref={input}
            id={`${id}-q`}
            className="ask__input"
            type="text"
            autoComplete="off"
            placeholder="Ask about DevFest..."
            /* Not reachable while the panel is shut: it is still in the
               document so it can be animated, and a field nobody can see is a
               field nobody should be able to tab into. */
            tabIndex={open ? undefined : -1}
          />
          <button type="submit" className="ask__send">
            <span className="visually-hidden">Ask</span>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path
                d="M7.5 12.5v-10M3 7l4.5-4.5L12 7"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
