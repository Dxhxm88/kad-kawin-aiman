import { saveRsvp, watchRsvps, demoMode } from "./db.js";
import { startPetals, celebrate, hearts } from "./effects.js";

startPetals();

const W = window.WEDDING;
const $ = (s, el = document) => el.querySelector(s);

/* ---------- fill text fields ---------- */
document.querySelectorAll("[data-f]").forEach((el) => {
  el.textContent = W[el.dataset.f] ?? "";
});
document.title = `${W.groom} & ${W.bride} — Jemputan Perkahwinan`;

/* ---------- guest name from ?to=Name ---------- */
const guest = new URLSearchParams(location.search).get("to");
if (guest) {
  $("#guestName").textContent = guest.slice(0, 60);
  $("#guestBox").hidden = false;
}

/* ---------- open invitation ---------- */
const audio = $("#bgm");
const musicBtn = $("#musicBtn");
if (W.music) {
  audio.src = W.music;
  musicBtn.hidden = false;
}
const setPlaying = (on) => musicBtn.classList.toggle("playing", on);
musicBtn.addEventListener("click", () => {
  if (audio.paused) audio.play().then(() => setPlaying(true)).catch(() => {});
  else { audio.pause(); setPlaying(false); }
});

$("#openBtn").addEventListener("click", () => {
  $("#cover").classList.add("opened");
  document.body.classList.remove("locked");
  window.scrollTo(0, 0);
  if (W.music) audio.play().then(() => setPlaying(true)).catch(() => {});
  celebrate();
  setTimeout(() => hearts(innerWidth / 2, innerHeight * 0.55, 16), 450);
});

/* tap the couple's names for a little shower of hearts */
document.querySelectorAll(".hero .big, footer .script").forEach((el) => {
  el.style.cursor = "pointer";
  el.addEventListener("click", (e) => hearts(e.clientX, e.clientY, 10));
});

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------- countdown ---------- */
const target = new Date(W.date).getTime();
const pad = (n) => String(n).padStart(2, "0");
function tick() {
  let diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 864e5); diff %= 864e5;
  const h = Math.floor(diff / 36e5);  diff %= 36e5;
  const m = Math.floor(diff / 6e4);   diff %= 6e4;
  const s = Math.floor(diff / 1e3);
  setNum("#cd-d", d);
  setNum("#cd-h", pad(h));
  setNum("#cd-m", pad(m));
  setNum("#cd-s", pad(s));
}
/* update a countdown number with a soft flip when it changes */
function setNum(sel, v) {
  const el = $(sel);
  if (el.textContent === String(v)) return;
  el.textContent = v;
  el.classList.remove("tick");
  void el.offsetWidth; // restart animation
  el.classList.add("tick");
}
tick();
setInterval(tick, 1000);

/* ---------- links ---------- */
const gcalDate = (iso) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
$("#calBtn").href =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent(`Majlis Perkahwinan ${W.bride} & ${W.groom}`)}` +
  `&dates=${gcalDate(W.date)}/${gcalDate(W.endDate || W.date)}` +
  `&location=${encodeURIComponent(`${W.venueName}, ${W.venueAddress}`)}`;
$("#gmapsBtn").href = W.googleMaps;
$("#wazeBtn").href = W.waze;

/* ---------- schedule & contacts ---------- */
$("#schedule").innerHTML = "";
W.schedule.forEach(({ time, title }) => {
  const li = document.createElement("li");
  li.innerHTML = `<span class="t"></span><span class="e"></span>`;
  li.querySelector(".t").textContent = time;
  li.querySelector(".e").textContent = title;
  $("#schedule").append(li);
});

W.contacts.forEach(({ name, phone }) => {
  const li = document.createElement("li");
  const digits = phone.replace(/\D/g, "");
  li.innerHTML = `<span class="c-name"></span>
    <span class="c-actions">
      <a class="btn btn-sm btn-outline" href="tel:${phone}">Hubungi</a>
      <a class="btn btn-sm btn-outline" target="_blank" rel="noopener" href="https://wa.me/${digits}">WhatsApp</a>
    </span>`;
  li.querySelector(".c-name").textContent = name;
  $("#contacts").append(li);
});

/* ---------- gift (Salam Kaut) ---------- */
const G = W.gift;
if (G && G.enabled) {
  $("#gift").hidden = false;
  document.querySelectorAll("[data-g]").forEach((el) => { el.textContent = G[el.dataset.g] ?? ""; });

  const img = $("#giftQr");
  if (G.qr) {
    img.src = G.qr;
    $("#saveQr").href = G.qr;
  }
  // no QR image yet (or wrong path) → just show the account details
  const noQr = () => {
    $("#qrFrame").hidden = true;
    $("#saveQr").hidden = true;
    $(".gift-intro").textContent = "Sekiranya ingin menghulurkan tanda kasih, boleh buat pindahan terus:";
  };
  if (!G.qr) noQr();
  img.addEventListener("error", noQr);

  const copyBtn = $("#copyAcc");
  copyBtn.addEventListener("click", async () => {
    const acc = String(G.accountNumber).replace(/\s+/g, "");
    try {
      await navigator.clipboard.writeText(acc);
    } catch {
      // older browsers: copy via a temporary text box
      const t = Object.assign(document.createElement("textarea"), { value: acc });
      document.body.append(t); t.select(); document.execCommand("copy"); t.remove();
    }
    copyBtn.textContent = "Disalin ✓";
    setTimeout(() => (copyBtn.textContent = "Salin"), 2000);
  });
}

/* ---------- RSVP form ---------- */
const form = $("#rsvpForm");
const msg = $("#formMsg");
const paxSel = $("#pax");
for (let i = 1; i <= (W.maxPax || 5); i++) paxSel.add(new Option(`${i} orang`, i));
if (W.rsvpDeadline) $("#deadline").textContent = `Sila maklumkan kehadiran sebelum ${W.rsvpDeadline}`;
if (guest) form.fullname.value = guest.slice(0, 80);
demoMode.then((demo) => { $("#demoNote").hidden = !demo; });

form.addEventListener("change", () => {
  $("#paxWrap").hidden = form.attending.value !== "yes";
});

const SENT_KEY = "wedding_rsvp_sent";
try {
  if (localStorage.getItem(SENT_KEY)) {
    msg.textContent = "Anda sudah menghantar RSVP dari peranti ini — terima kasih! Anda boleh hantar sekali lagi jika perlu.";
  }
} catch {}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = form.fullname.value.trim();
  if (!name) {
    msg.textContent = "Sila masukkan nama anda.";
    msg.className = "form-msg err";
    form.fullname.focus();
    return;
  }
  const btn = $("#submitBtn");
  btn.disabled = true;
  btn.textContent = "Menghantar…";
  msg.className = "form-msg";
  msg.textContent = "";
  const attending = form.attending.value === "yes";
  try {
    await saveRsvp({
      name,
      attending,
      pax: form.pax.value,
      wish: form.wish.value,
      website: form.website.value,
    });
    try { localStorage.setItem(SENT_KEY, "1"); } catch {}
    form.reset();
    if (guest) form.fullname.value = guest.slice(0, 80);
    $("#paxWrap").hidden = false;
    msg.textContent = "Terima kasih! RSVP anda telah diterima. 🤍";
    msg.className = "form-msg ok";
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    if (attending) celebrate({ x: cx, y: r.top, count: 70 });
    hearts(cx, r.top, attending ? 14 : 8);
  } catch (err) {
    console.error(err);
    msg.textContent = "Maaf, ada masalah. Sila cuba lagi.";
    msg.className = "form-msg err";
  } finally {
    btn.disabled = false;
    btn.textContent = "Hantar RSVP";
  }
});

/* ---------- wishes list ---------- */
const timeAgo = (ms) => {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "baru sahaja";
  if (s < 3600) return `${Math.floor(s / 60)} minit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return new Date(ms).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" });
};

watchRsvps(
  (list) => {
    const yes = list.filter((r) => r.attending);
    const pax = yes.reduce((a, r) => a + (Number(r.pax) || 0), 0);
    $("#stats").textContent = list.length
      ? `${yes.length} hadir (${pax} tetamu) · ${list.length - yes.length} tidak dapat hadir`
      : "";

    const ul = $("#wishes");
    const withWish = list.filter((r) => r.wish);
    ul.innerHTML = "";
    if (!withWish.length) {
      ul.innerHTML = `<li class="muted">Tiada ucapan lagi. Jadi yang pertama!</li>`;
      return;
    }
    withWish.forEach((r) => {
      const li = document.createElement("li");
      li.innerHTML = `<p class="w-head"><b></b><span class="badge"></span></p><p class="w-body"></p><p class="w-time"></p>`;
      li.querySelector("b").textContent = r.name;
      const badge = li.querySelector(".badge");
      badge.textContent = r.attending ? "Hadir" : "Tidak hadir";
      badge.classList.toggle("no", !r.attending);
      li.querySelector(".w-body").textContent = r.wish;
      li.querySelector(".w-time").textContent = timeAgo(r.createdAt);
      ul.append(li);
    });
  },
  (err) => {
    console.error(err);
    $("#wishes").innerHTML = `<li class="muted">Ucapan tidak dapat dimuatkan sekarang.</li>`;
  }
);
