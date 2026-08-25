"use client";

import { useSyncExternalStore } from "react";

/* Which of two views the reader chose, remembered.
 *
 * localStorage is subscribed to rather than copied into state. A `storage`
 * event carries a change made in another tab, and a write made here tells its
 * own subscribers, since the browser does not raise that event for the tab
 * that caused it. The server snapshot is the first option, because the server
 * cannot know what this reader chose: React hydrates against that and
 * re-renders with the real value, so a remembered second view arrives a beat
 * after the first rather than never.
 *
 * One listener set serves every key. A write under one key wakes the other
 * page's subscriber too, which costs a read that returns the same string and
 * so re-renders nothing.
 */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Remembers one of two named views under `key`. */
export function useRememberedView<A extends string, B extends string>(
  key: string,
  first: A,
  second: B,
): [A | B, (next: A | B) => void] {
  const read = (): A | B => {
    try {
      return localStorage.getItem(key) === second ? second : first;
    } catch {
      return first;
    }
  };

  const view = useSyncExternalStore(subscribe, read, () => first as A | B);

  const set = (next: A | B) => {
    try {
      localStorage.setItem(key, next);
    } catch {
      /* not remembered, still switched */
    }
    for (const listener of listeners) listener();
  };

  return [view, set];
}
