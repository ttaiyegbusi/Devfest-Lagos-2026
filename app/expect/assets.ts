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
