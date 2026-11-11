# Drop the full-size photographs here

This folder is a staging area, not something the site serves. Files put here
are turned into the WebP pairs in `public/expect` and are not deployed.

Two jobs use it:

**Replacing a shot.** Drop the full-size photograph in. It gets cropped to the
220:249 frame the grid uses and written out at both 220x249 and 440x498.

**Re-cutting an existing shot at 2x.** Drop the original the shot was cropped
from and run:

    python3 scripts/reshoot.py incoming --check

That finds the crop the current shot was cut from and cuts it again at twice
the size. See HANDOFF.md for what it does and does not accept.

Any common format is fine — JPEG, PNG, HEIC, TIFF — and the names do not
matter. Straight off the camera is ideal: the bigger the file, the better the
result.
