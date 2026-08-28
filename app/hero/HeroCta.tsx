import { TICKETS } from "../links";

/* The hero's primary action: buy tickets.
 *
 * The ask action is now available globally via the floating button in the
 * bottom right corner, so it doesn't need to be here. This simplifies the
 * hero and makes the buying action the clear primary call-to-action. */

export function HeroCta() {
  return (
    <div className="hero__cta">
      {/* An anchor, not a button that navigates. It goes somewhere, so it
          should behave like everything else that goes somewhere: openable in
          a new tab, copyable, and announced as a link. It is styled as the
          solid block the design asks for either way. */}
      <a className="hero__buy" href={TICKETS}>
        Buy Tickets
      </a>
    </div>
  );
}
