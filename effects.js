/* Soft romantic effects on one full-screen canvas:
   - falling petals (ambient)
   - confetti burst (open invitation / RSVP)
   - floating hearts
   All skipped when the visitor prefers reduced motion. */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.createElement("canvas");
canvas.className = "fx-canvas";
canvas.setAttribute("aria-hidden", "true");
document.body.append(canvas);
const ctx = canvas.getContext("2d");

let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
addEventListener("resize", resize);

const PETAL_COLORS = ["#f4d6d2", "#efc3c0", "#f7e3dc", "#e9cfa9", "#fbeee6"];
const CONFETTI_COLORS = ["#b08d57", "#d8b67a", "#efc3c0", "#e7a9a4", "#c9d3bf", "#fffdf8"];
const HEART_COLORS = ["#e7a9a4", "#d98c87", "#efc3c0", "#d8b67a"];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

const particles = [];
let ambientOn = false;
let running = false;

/* ---------- shapes ---------- */
function drawPetal(p) {
  const s = p.size;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.7, 0, s);
  ctx.bezierCurveTo(-s * 0.7, s * 0.7, -s * 0.9, -s * 0.6, 0, -s);
  ctx.fillStyle = p.color;
  ctx.fill();
  // soft vein
  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.quadraticCurveTo(s * 0.1, 0, 0, s * 0.8);
  ctx.stroke();
}

function drawHeart(p) {
  const s = p.size / 2;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.6);
  ctx.bezierCurveTo(-s * 2, -s * 0.6, -s * 0.8, -s * 2, 0, -s * 0.8);
  ctx.bezierCurveTo(s * 0.8, -s * 2, s * 2, -s * 0.6, 0, s * 0.6);
  ctx.fillStyle = p.color;
  ctx.fill();
}

function drawConfetti(p) {
  ctx.fillStyle = p.color;
  if (p.round) {
    ctx.beginPath();
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // flip effect: scale Y by cos of spin
    ctx.scale(1, Math.cos(p.flip));
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
  }
}

/* ---------- particle factories ---------- */
function petal(fromTop = true) {
  return {
    kind: "petal",
    x: rand(0, W),
    y: fromTop ? rand(-40, -10) : rand(0, H),
    size: rand(5, 10),
    color: pick(PETAL_COLORS),
    vy: rand(0.35, 0.9),
    sway: rand(0.4, 1.2),
    phase: rand(0, Math.PI * 2),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.02, 0.02),
    alpha: rand(0.55, 0.9),
    ambient: true,
  };
}

/* ---------- loop ---------- */
let last = 0;
function frame(t) {
  const dt = Math.min(2, (t - last) / 16.67 || 1);
  last = t;
  ctx.clearRect(0, 0, W, H);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    if (p.kind === "petal") {
      p.phase += 0.02 * dt;
      p.x += Math.sin(p.phase) * p.sway * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > H + 20) {
        if (ambientOn && p.ambient) Object.assign(p, petal(true));
        else { particles.splice(i, 1); continue; }
      }
    } else if (p.kind === "heart") {
      p.life -= dt;
      p.vy -= 0.004 * dt;
      p.phase += 0.05 * dt;
      p.x += (p.vx + Math.sin(p.phase) * 0.6) * dt;
      p.y += p.vy * dt;
      p.alpha = Math.min(1, p.life / 40);
      if (p.life <= 0) { particles.splice(i, 1); continue; }
    } else {
      // confetti
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.12 * dt;
      p.x += p.vx * dt + Math.sin(p.phase += 0.08) * 0.4;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += 0.15 * dt;
      p.life -= dt;
      p.alpha = Math.min(1, p.life / 50);
      if (p.life <= 0 || p.y > H + 30) { particles.splice(i, 1); continue; }
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    if (p.kind === "petal") drawPetal(p);
    else if (p.kind === "heart") drawHeart(p);
    else drawConfetti(p);
    ctx.restore();
  }

  if (particles.length) requestAnimationFrame(frame);
  else running = false;
}

function kick() {
  if (running || document.hidden) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}
document.addEventListener("visibilitychange", kick);

/* ---------- public API ---------- */

/** Gentle petals drifting down, forever. */
export function startPetals() {
  if (reduced || ambientOn) return;
  ambientOn = true;
  const n = W < 600 ? 14 : 24;
  for (let i = 0; i < n; i++) particles.push(petal(false));
  kick();
}

/** Confetti + petals bursting from a point (defaults: both bottom corners). */
export function celebrate({ x, y, count = 90 } = {}) {
  if (reduced) return;
  const origins = x == null ? [[0, H], [W, H]] : [[x, y]];
  origins.forEach(([ox, oy]) => {
    const toRight = x == null ? ox === 0 : null;
    for (let i = 0; i < count / origins.length; i++) {
      let angle, speed;
      if (toRight == null) { angle = rand(-Math.PI * 0.85, -Math.PI * 0.15); speed = rand(4, 10); }
      else { angle = toRight ? rand(-Math.PI * 0.45, -Math.PI * 0.2) : rand(-Math.PI * 0.8, -Math.PI * 0.55); speed = rand(9, 17); }
      const isPetal = Math.random() < 0.25;
      particles.push(isPetal
        ? { ...petal(), x: ox, y: oy, ambient: false, vy: rand(0.8, 1.6) }
        : {
            kind: "confetti", x: ox, y: oy,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            size: rand(5, 9), color: pick(CONFETTI_COLORS), round: Math.random() < 0.3,
            rot: rand(0, Math.PI * 2), vr: rand(-0.2, 0.2), flip: rand(0, 6), phase: rand(0, 6),
            life: rand(110, 170), alpha: 1,
          });
    }
  });
  kick();
}

/** Little hearts floating up from a point. */
export function hearts(x = W / 2, y = H * 0.6, count = 14) {
  if (reduced) return;
  for (let i = 0; i < count; i++) {
    particles.push({
      kind: "heart", x: x + rand(-30, 30), y: y + rand(-10, 10),
      vx: rand(-0.6, 0.6), vy: rand(-1.8, -0.8),
      size: rand(10, 18), color: pick(HEART_COLORS),
      rot: rand(-0.3, 0.3), phase: rand(0, 6), life: rand(90, 150), alpha: 1,
    });
  }
  kick();
}
