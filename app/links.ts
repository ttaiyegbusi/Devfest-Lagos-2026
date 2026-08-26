/* Destinations that live outside this site.
 *
 * One constant rather than one per component: the hero's buy control and the
 * nav's both point here, and a ticketing URL that changes in one of two places
 * is a dead link nobody notices until someone tries to pay. */

/** Ticketing is a separate host, so anything pointing here leaves the site. */
export const TICKETS = "https://tickets.devfestlagos.com/buy";

/* GDG Lagos's own accounts. The footer lists them and the FAQ sends people to
   them for announcements, so they are named once here.

   Facebook is in the footer's list and is deliberately absent: nobody has
   given us that handle, and sending people to the wrong account is worse than
   not linking yet. */
export const SOCIALS: Record<string, string> = {
  X: "https://x.com/gdglagos",
  Instagram: "https://www.instagram.com/gdglagos",
  Linkedin: "https://www.linkedin.com/company/gdg-lagos/",
  Youtube: "https://www.youtube.com/@GDGLagos",
};
