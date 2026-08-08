#!/usr/bin/env python3
"""Stamp a fresh version onto every local CSS and JS reference.

GitHub Pages serves assets with Cache-Control: max-age=600, so a returning
visitor can run a stale stylesheet or script against a freshly deployed page.
That mismatch is invisible in testing and breaks things like form wiring.

Giving each asset URL a ?v= stamp makes every deploy a new URL, so browsers
always fetch the matching files. Run this before committing whenever CSS or
JS changed:

    python3 scripts/bump-assets.py

Then commit the touched HTML along with your changes.
"""

import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSET = re.compile(r'((?:href|src)="assets/(?:css|js)/[a-z0-9-]+\.(?:css|js))(?:\?v=[0-9]+)?"')


def main():
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
    touched = 0

    for page in sorted(ROOT.glob("*.html")):
        text = page.read_text()
        stamped, count = ASSET.subn(rf'\1?v={stamp}"', text)
        if count and stamped != text:
            page.write_text(stamped)
            touched += 1
            print(f"{page.name}: {count} asset links stamped")

    if not touched:
        print("No asset links found to stamp.", file=sys.stderr)
        return 1

    print(f"\nVersion {stamp} applied across {touched} pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
