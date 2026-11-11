/* The view-toggle icons.
 *
 * Each is drawn as the shape of the thing it switches to — rows for a list,
 * tiles for a gallery, more and smaller tiles for a grid — and they live
 * together so the two toggles cannot drift apart.
 *
 * They sit beside ViewToggle rather than inside it because of Fast Refresh.
 * React can only hot-swap a module while preserving state if that module
 * exports components and nothing else; a component sitting next to three plain
 * values means every edit to the file is a full reload instead. These are
 * values — JSX elements, not functions — so keeping them here leaves
 * ViewToggle.tsx exporting only its component, and leaves this file exporting
 * no components at all. Neither one is mixed, so neither one is the problem.
 *
 * oxlint says the same thing as react(only-export-components), and says it as
 * an error: `npm run lint` carries --deny-warnings.
 */

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
