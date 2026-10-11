"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AskPanel } from "./AskPanel";
import { AskContext } from "./useAsk";

/* The one ask panel, and the two controls that open it.
 *
 * The hero's button and the floating one each used to render a panel of their
 * own, so a question asked from the hero was gone from the panel the floating
 * button opened a scroll later. There is one conversation, so there is one
 * panel: it lives here, in the layout, and the buttons only ask for it. */

export function AskProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const returnTo = useRef<HTMLElement | null>(null);

  const toggle = useCallback((trigger: HTMLElement | null) => {
    returnTo.current = trigger;
    setOpen((v) => !v);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ open, toggle }), [open, toggle]);

  return (
    <AskContext.Provider value={value}>
      {children}
      <AskPanel open={open} onClose={close} returnTo={returnTo} />
    </AskContext.Provider>
  );
}
