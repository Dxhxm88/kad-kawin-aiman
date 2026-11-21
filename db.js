/* RSVP storage.
   Online (Netlify) and with `python serve.py`: RSVPs go to /api/rsvp and are stored as JSON.
   If that API isn't reachable (e.g. the page is opened some other way), RSVPs fall back
   to this browser only ("demo mode") so the card still works for previewing. */
const API = "/api/rsvp";
const POLL_MS = 15000; // how often the wishes list refreshes

const listeners = new Set();
let cache = [];

/* ---------- demo fallback ---------- */
const LS_KEY = "wedding_rsvps_demo";
const lsRead = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
};

/* ---------- detect whether the API exists (resolves true when in demo mode) ---------- */
export const demoMode = fetch(API, { cache: "no-store" })
  .then(async (r) => {
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return true;
    cache = await r.json();
    return false;
  })
  .catch(() => true);

function emit(list) {
  cache = list;
  listeners.forEach((cb) => cb(list));
}

async function refresh(onError) {
  if (await demoMode) return emit(lsRead());
  try {
    const r = await fetch(API, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    emit(await r.json());
  } catch (err) {
    onError?.(err);
  }
}

/** Save one RSVP. */
export async function saveRsvp(data) {
  const rsvp = {
    name: String(data.name).trim().slice(0, 80),
    attending: !!data.attending,
    pax: data.attending ? Math.max(1, Math.min(20, Number(data.pax) || 1)) : 0,
    wish: String(data.wish || "").trim().slice(0, 500),
    website: data.website || "", // spam trap, should stay empty
  };

  if (await demoMode) {
    const list = lsRead();
    delete rsvp.website;
    list.unshift({ ...rsvp, id: String(Date.now()), createdAt: Date.now() });
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
    return emit(list);
  }

  const r = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rsvp),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  await refresh();
}

/** Subscribe to all RSVPs, newest first. Returns an unsubscribe fn. */
export function watchRsvps(cb, onError = console.error) {
  listeners.add(cb);
  demoMode.then((demo) => cb(demo ? lsRead() : cache));

  const timer = setInterval(() => {
    if (!document.hidden) refresh(onError);
  }, POLL_MS);
  const onVisible = () => { if (!document.hidden) refresh(onError); };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    listeners.delete(cb);
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
