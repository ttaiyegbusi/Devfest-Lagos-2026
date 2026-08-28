"use client";

import { useRef, useState } from "react";
import { AskPanel } from "./AskPanel";
import "./FloatingAskButton.css";

export function FloatingAskButton() {
  const [asking, setAsking] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        type="button"
        className="floating-ask"
        ref={trigger}
        aria-expanded={asking}
        onClick={() => setAsking((v) => !v)}
        aria-label={asking ? "Close the question panel" : "Ask a question about DevFest"}
      >
        <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 1.6l1.9 4.9 4.9 1.9-4.9 1.9L10 15.2 8.1 10.3 3.2 8.4l4.9-1.9L10 1.6Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <AskPanel open={asking} onClose={() => setAsking(false)} returnTo={trigger} />
    </>
  );
}
