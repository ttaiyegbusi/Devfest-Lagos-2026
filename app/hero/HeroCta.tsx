"use client";

import { useRef, useState } from "react";
import { AskPanel } from "../chat/AskPanel";
import { TICKETS } from "../links";

/* The hero's pair of actions: buy, and ask.
 *
 * This replaces the "Ask me anything..." field that used to sit here. That
 * field was a search box dressed as a conversation — it navigated to the FAQ
 * with the question in the URL and the page jumped. Asking now happens where
 * you asked, in a panel, and the primary action gets the space it deserves. */

export function HeroCta() {
  const [asking, setAsking] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="hero__cta">
        {/* An anchor, not a button that navigates. It goes somewhere, so it
            should behave like everything else that goes somewhere: openable in
            a new tab, copyable, and announced as a link. It is styled as the
            solid block the design asks for either way. */}
        <a className="hero__buy" href={TICKETS}>
          Buy Tickets
        </a>

        <button
          type="button"
          className="hero__ask-open"
          ref={trigger}
          aria-expanded={asking}
          onClick={() => setAsking((v) => !v)}
        >
          <span className="visually-hidden">
            {asking ? "Close the question panel" : "Ask a question about DevFest"}
          </span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 1.6l1.9 4.9 4.9 1.9-4.9 1.9L10 15.2 8.1 10.3 3.2 8.4l4.9-1.9L10 1.6Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <AskPanel open={asking} onClose={() => setAsking(false)} returnTo={trigger} />
    </>
  );
}
