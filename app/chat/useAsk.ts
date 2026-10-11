"use client";

import { createContext, useContext } from "react";

/* How a control opens the ask panel. Apart from AskProvider.tsx only so that
   file exports nothing but its component, which is what fast refresh wants. */

export type Ask = {
  open: boolean;
  /** Opens or shuts the panel. `trigger` is where focus goes back to when it
   *  shuts — the control that was used, not always the same one. */
  toggle: (trigger: HTMLElement | null) => void;
};

export const AskContext = createContext<Ask | null>(null);

export function useAsk(): Ask {
  const ask = useContext(AskContext);
  if (!ask) throw new Error("useAsk() needs an <AskProvider> above it");
  return ask;
}
