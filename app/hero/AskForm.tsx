"use client";

import { useRouter } from "next/navigation";
import { useId, useRef } from "react";

/* The hero's "Ask me anything…" control.
 *
 * It was `action="#"`: pressing Enter navigated to "#", reloaded the page and
 * threw the question away. It is `role="search"`, so the fix is to make it
 * search something — and the only body of answers on this site is the FAQ.
 * Submitting carries the question there as `?q=`, which the FAQ filters on.
 *
 * That is an interpretation, not a spec. If "ask" is meant to reach an
 * assistant rather than the FAQ, this is the one place that has to change:
 * swap the router.push for the call, and leave the FAQ reading `q` for people
 * who arrive with a search in the URL. */
export function AskForm() {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  return (
    <form
      className="hero__ask"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const q = input.current?.value.trim() ?? "";
        if (!q) {
          input.current?.focus();
          return;
        }
        router.push(`/?q=${encodeURIComponent(q)}#faq`);
      }}
    >
      <label className="visually-hidden" htmlFor={`${id}-ask`}>
        Ask about DevFest Lagos
      </label>
      <svg
        className="hero__ask-icon"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="6.6"
          cy="6.6"
          r="5.35"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10.6 10.6L15.1 15.1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <input
        ref={input}
        id={`${id}-ask`}
        className="hero__ask-input"
        type="search"
        name="q"
        placeholder="Ask me anything..."
        autoComplete="off"
      />
    </form>
  );
}
