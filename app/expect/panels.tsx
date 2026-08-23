import { TRACKS } from "./tracks";
import { ExpectPanel } from "./Expect";

/* The panels are handed to the stack in page.tsx as siblings of the hero
   rather than wrapped in a stack of their own here. 01 has to rise over the
   hero the same way 02 rises over 01, and it can only do that if the hero is
   a pinned layer in the same stack — a stack starting at 01 leaves 01 with
   nothing underneath to climb over.

   This is its own file because it is not a component: it hands back a list, so
   that each panel reaches the stack as a separate child. A file that exports
   both a component and something else opts out of fast refresh for everything
   in it, which is what the lint rule is pointing at. */
export function expectPanels() {
  return TRACKS.map((track, i) => (
    <ExpectPanel
      key={track.n}
      track={track}
      /* "About" in the nav means what the day actually is, which is what these
         four panels are. The first one carries the anchor. */
      anchor={i === 0 ? "about" : undefined}
    />
  ));
}
