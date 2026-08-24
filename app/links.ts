/* Destinations that live outside this site.
 *
 * One constant rather than one per component: the hero's buy control and the
 * nav's both point here, and a ticketing URL that changes in one of two places
 * is a dead link nobody notices until someone tries to pay. */

/** Ticketing is a separate host, so anything pointing here leaves the site. */
export const TICKETS = "https://tickets.devfestlagos.com/buy";
