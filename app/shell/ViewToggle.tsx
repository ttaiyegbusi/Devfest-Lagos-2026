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

/* The icons, kept here so the two toggles cannot drift apart. Each is drawn as
   the shape of the thing it switches to — rows for a list, tiles for a
   gallery, more and smaller tiles for a grid. */

export const ListIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
    <path
      d="M1 3h12M1 7h12M1 11h12"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export const GalleryIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
    <path
      d="M1.5 1.5h4v4h-4zM8.5 1.5h4v4h-4zM1.5 8.5h4v4h-4zM8.5 8.5h4v4h-4z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

export const GridIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
    <path
      d="M1.5 1.5h3v3h-3zM5.5 1.5h3v3h-3zM9.5 1.5h3v3h-3zM1.5 5.5h3v3h-3zM5.5 5.5h3v3h-3zM9.5 5.5h3v3h-3zM1.5 9.5h3v3h-3zM5.5 9.5h3v3h-3zM9.5 9.5h3v3h-3z"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
);
