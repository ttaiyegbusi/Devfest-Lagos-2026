"use client";

import "./Views.css";

/* Two ways to look at the same thing, and a control to choose between them.
 *
 * The schedule reads as a list or as a gallery; the lineup reads as a grid of
 * many small faces or as a gallery of few large ones. Neither pair has a
 * fallback in it — the choice is the reader's, and it is remembered by
 * useRememberedView in app/shell/views.ts.
 */

export type ViewOption<V extends string> = {
  value: V;
  label: string;
  icon: React.ReactNode;
};

/* Two buttons rather than a single toggle: "switch to gallery" and "switch to
   list" are two different things to ask for, and a lone button would have to
   be read to know which one it is offering. */
export function ViewToggle<V extends string>({
  options,
  view,
  onChange,
  label,
}: {
  options: ViewOption<V>[];
  view: V;
  onChange: (next: V) => void;
  label: string;
}) {
  return (
    <div className="viewtoggle" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="viewtoggle__btn"
          aria-pressed={view === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* The icons live in ./icons, not here. Fast Refresh can only hot-swap a module
   while keeping its state if that module exports components and nothing else,
   and three JSX values beside this component made every edit to this file a
   full reload. oxlint enforces it as react(only-export-components). */
