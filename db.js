/* RSVP storage: Firestore when configured, localStorage otherwise. */
const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const cfg = window.WEDDING.firebase;
export const isDemo = !cfg || !cfg.apiKey;

let fs = null; // { db, api }

async function firestore() {
  if (fs) return fs;
  const { initializeApp } = await import(`${SDK}/firebase-app.js`);
  const api = await import(`${SDK}/firebase-firestore.js`);
  const app = initializeApp(cfg);
  fs = { db: api.getFirestore(app), api };
  return fs;
}

const LS_KEY = "wedding_rsvps_demo";
const lsRead = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
};
const lsListeners = new Set();

/** Save one RSVP. */
export async function saveRsvp(data) {
  const clean = {
    name: String(data.name).trim().slice(0, 80),
    attending: !!data.attending,
    pax: data.attending ? Math.max(1, Math.min(20, Number(data.pax) || 1)) : 0,
    wish: String(data.wish || "").trim().slice(0, 500),
  };
  if (isDemo) {
    const list = lsRead();
    list.unshift({ ...clean, id: crypto.randomUUID?.() || String(Date.now()), createdAt: Date.now() });
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
    lsListeners.forEach((cb) => cb(list));
    return;
  }
  const { db, api } = await firestore();
  await api.addDoc(api.collection(db, "rsvps"), { ...clean, createdAt: api.serverTimestamp() });
}

/** Subscribe to all RSVPs, newest first. Returns an unsubscribe fn. */
export function watchRsvps(cb, onError = console.error) {
  if (isDemo) {
    lsListeners.add(cb);
    cb(lsRead());
    return () => lsListeners.delete(cb);
  }
  let unsub = () => {};
  firestore()
    .then(({ db, api }) => {
      const q = api.query(api.collection(db, "rsvps"), api.orderBy("createdAt", "desc"), api.limit(500));
      unsub = api.onSnapshot(
        q,
        (snap) =>
          cb(snap.docs.map((d) => {
            const v = d.data();
            return { id: d.id, ...v, createdAt: v.createdAt?.toMillis?.() ?? Date.now() };
          })),
        onError
      );
    })
    .catch(onError);
  return () => unsub();
}
