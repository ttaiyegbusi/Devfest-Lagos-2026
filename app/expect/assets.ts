import { existsSync } from "node:fs";
import { join } from "node:path";

/* Photographs are wired up before the files themselves land, so a shot's path
   is a statement of intent rather than a promise. Checking here lets the panel
   fall back to its tinted placeholder instead of rendering a broken frame, and
   the real picture appears the moment the file is dropped in.
   
   Server-only: this runs at render in dev and at build for an export. */
export function onDisk(publicPath: string) {
  return existsSync(join(process.cwd(), "public", publicPath));
}

/* The photographs are authored at exactly the size they are displayed — 220x249
   for the strip, the grid and the after-party band, 492x567 for panel 01 — so
   at 1x they land pixel for pixel and there is nothing to win from srcset. On
   a 2x display every one of them is upscaled by exactly two, and reads soft.
   That is a shortfall in the originals, not in the code: no encoder setting
   recovers detail the file never carried.

   What the code can do is be ready. A shot named "/expect/foo.webp" takes its
   double from "/expect/foo@2x.webp" the moment that file exists, and offers
   the pair as a srcset so the browser picks by device ratio. Until then the
   attribute is absent and the single src stands, exactly as before — the same
   bargain onDisk() already strikes for the photographs themselves.

   Checked on disk rather than assumed, for the same reason: a srcset naming a
   file that is not there costs a 404 and a blank frame on precisely the
   displays it was meant to help.

   Server-only: this runs at render in dev and at build for an export. */
export function retina(publicPath: string) {
  const at2x = publicPath.replace(/(\.[^./]+)$/, "@2x$1");
  if (at2x === publicPath) return undefined;
  return onDisk(at2x) ? `${publicPath} 1x, ${at2x} 2x` : undefined;
}
