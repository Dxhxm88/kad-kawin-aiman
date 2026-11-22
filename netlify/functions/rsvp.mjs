/* RSVP API on Netlify — each RSVP is saved as one JSON record in Netlify Blobs.
   GET  /api/rsvp                     → public view for the card: { stats, wishes }
   GET  /api/rsvp + x-admin-pin header → full RSVP list (for admin.html)
   POST /api/rsvp                     → save one RSVP { name, attending, pax, wish }

   The admin PIN is set in Netlify: Site configuration → Environment variables → ADMIN_PIN */
import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const store = () => getStore({ name: "rsvps", consistency: "strong" });

function clean(body) {
  const name = String(body?.name ?? "").trim().slice(0, 80);
  if (!name) return null;
  const attending = body.attending === true;
  const pax = attending ? Math.max(1, Math.min(20, parseInt(body.pax, 10) || 1)) : 0;
  const wish = String(body.wish ?? "").trim().slice(0, 500);
  return { name, attending, pax, wish, createdAt: Date.now() };
}

/* what everyone can see: totals + the wishes (no per-guest pax, no names of people without a wish) */
function publicView(list) {
  const yes = list.filter((r) => r.attending);
  return {
    stats: {
      yes: yes.length,
      pax: yes.reduce((a, r) => a + (Number(r.pax) || 0), 0),
      no: list.length - yes.length,
    },
    wishes: list
      .filter((r) => r.wish)
      .map(({ id, name, attending, wish, createdAt }) => ({ id, name, attending, wish, createdAt })),
  };
}

const sha = (s) => createHash("sha256").update(String(s)).digest();
const pinOk = (given, real) => !!given && timingSafeEqual(sha(given), sha(real));

export default async (req) => {
  const rsvps = store();

  if (req.method === "GET") {
    const { blobs } = await rsvps.list();
    const list = (await Promise.all(blobs.map((b) => rsvps.get(b.key, { type: "json" }))))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);

    const given = req.headers.get("x-admin-pin");
    if (given != null) {
      const real = process.env.ADMIN_PIN;
      if (!real) return json({ error: "ADMIN_PIN is not set on Netlify" }, 503);
      if (!pinOk(given, real)) {
        await new Promise((r) => setTimeout(r, 800)); // slow down guessing
        return json({ error: "Wrong PIN" }, 401);
      }
      return json(list);
    }
    return json(publicView(list));
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    // hidden "website" field: real guests leave it empty, spam bots fill it in
    if (body?.website) return json({ ok: true });
    const rsvp = clean(body);
    if (!rsvp) return json({ error: "Name is required" }, 400);
    // key starts with the time so records stay in order; random part avoids clashes
    const key = `${rsvp.createdAt}-${Math.random().toString(36).slice(2, 8)}`;
    await rsvps.setJSON(key, { id: key, ...rsvp });
    return json({ ok: true, id: key }, 201);
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/rsvp" };
