#!/usr/bin/env python3
"""Local preview server that resolves URLs the way GitHub Pages does.

The site uses clean URLs like /about rather than /about.html. Python's plain
http.server returns 404 for those, so local previews would not match the live
site. This server tries the exact path, then path.html, then path/index.html,
and finally serves 404.html with a real 404 status, which is what GitHub Pages
does for any unmatched path.

    python3 scripts/serve.py [port]
"""

import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class PagesHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)
        if os.path.isdir(local):
            return local
        if os.path.exists(local):
            return local
        candidate = local + ".html"
        if os.path.exists(candidate):
            return candidate
        return local

    def send_error(self, code, message=None, explain=None):
        custom = os.path.join(ROOT, "404.html")
        if code == 404 and os.path.exists(custom):
            with open(custom, "rb") as fh:
                body = fh.read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    handler = partial(PagesHandler, directory=ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"Serving {ROOT} at http://127.0.0.1:{port} with clean URLs")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
