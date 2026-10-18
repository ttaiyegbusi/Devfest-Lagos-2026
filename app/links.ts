/* Destinations that live outside this site.
 *
 * One constant rather than one per component: the hero's buy control and the
 * nav's both point here, and a ticketing URL that changes in one of two places
 * is a dead link nobody notices until someone tries to pay. */

/** Ticketing is a separate host, so anything pointing here leaves the site. */
export const TICKETS = "https://tickets.devfestlagos.com/buy";

/** Landmark Event Centre on Google Maps. The ask panel's answer to "how do I
 *  get there?" is this link and nothing else. */
export const VENUE_MAP = "https://maps.app.goo.gl/rgW3CRUkedhZYUMR6";

/** The conference game, also its own host. Listed in the footer's Product column. */
export const GAME = "https://game.devfestlagos.com/";

/* GDG Lagos's own accounts. The footer lists them and the FAQ sends people to
   them for announcements, so they are named once here. */
export const SOCIALS: Record<string, string> = {
  X: "https://x.com/gdglagos",
  Instagram: "https://www.instagram.com/gdglagos",
  Linkedin: "https://www.linkedin.com/company/gdg-lagos/",
  Youtube: "https://www.youtube.com/@GDGLagos",
  Facebook: "https://web.facebook.com/people/Google-Developers-Group-Lagos/100075612535619/",
};
