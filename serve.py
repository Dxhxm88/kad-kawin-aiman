"""Local preview server:  python serve.py  ->  http://localhost:5500

- Serves the card (and fixes Windows serving .js as text/plain, which breaks ES modules).
- Pretends to be the Netlify function at /api/rsvp, saving RSVPs to rsvps.json in this
  folder, so you can test the RSVP form on your PC. (Online, Netlify Blobs is used instead.)
"""
import hashlib
import hmac
import http.server
import json
import os
import random
import socketserver
import string
import threading
import time
from pathlib import Path

PORT = 5500
# Admin PIN for admin.html when previewing locally (online it comes from Netlify's ADMIN_PIN)
ADMIN_PIN = os.environ.get("ADMIN_PIN", "1234")
DATA = Path(__file__).with_name("rsvps.json")
LOCK = threading.Lock()


def load():
    try:
        return json.loads(DATA.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def clean(body):
    """Same checks as netlify/functions/rsvp.mjs."""
    name = str(body.get("name") or "").strip()[:80]
    if not name:
        return None
    attending = body.get("attending") is True
    try:
        pax = int(body.get("pax"))
    except (TypeError, ValueError):
        pax = 1
    pax = max(1, min(20, pax)) if attending else 0
    wish = str(body.get("wish") or "").strip()[:500]
    created = int(time.time() * 1000)
    key = f"{created}-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {"id": key, "name": name, "attending": attending, "pax": pax, "wish": wish, "createdAt": created}


def public_view(items):
    """Same as publicView() in netlify/functions/rsvp.mjs."""
    yes = [r for r in items if r.get("attending")]
    return {
        "stats": {"yes": len(yes), "pax": sum(int(r.get("pax") or 0) for r in yes), "no": len(items) - len(yes)},
        "wishes": [
            {k: r.get(k) for k in ("id", "name", "attending", "wish", "createdAt")}
            for r in items if r.get("wish")
        ],
    }


def pin_ok(given):
    sha = lambda v: hashlib.sha256(str(v).encode()).digest()
    return bool(given) and hmac.compare_digest(sha(given), sha(ADMIN_PIN))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".mp3": "audio/mpeg",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }

    def send_json(self, data, status=200):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/rsvp":
            with LOCK:
                items = sorted(load(), key=lambda r: r["createdAt"], reverse=True)
            given = self.headers.get("x-admin-pin")
            if given is not None:
                if not pin_ok(given):
                    time.sleep(0.8)
                    return self.send_json({"error": "Wrong PIN"}, 401)
                return self.send_json(items)
            return self.send_json(public_view(items))
        if self.path.split("?")[0] == "/rsvps.json":
            return self.send_error(404)  # don't serve the raw data file
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/rsvp":
            return self.send_error(404)
        try:
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self.send_json({"error": "Invalid JSON"}, 400)
        if body.get("website"):
            return self.send_json({"ok": True})
        rsvp = clean(body)
        if not rsvp:
            return self.send_json({"error": "Name is required"}, 400)
        with LOCK:
            items = load()
            items.append(rsvp)
            DATA.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
        return self.send_json({"ok": True, "id": rsvp["id"]}, 201)


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
    print(f"Serving on http://localhost:{PORT}  (RSVPs saved to {DATA.name}, admin PIN: {ADMIN_PIN})")
    httpd.serve_forever()
