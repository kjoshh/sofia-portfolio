/* ── Organic film-negative ink spread ── */
(function () {
  document.querySelectorAll(".archive-grid-item").forEach(item => {
    const img = item.querySelector("img");
    if (!img) return;
    const isBW = item.classList.contains("bw");
    const filmFilter = isBW
      ? "invert(1) contrast(0.85)"
      : "invert(1) sepia(0.65) contrast(0.85) saturate(0.85)";

    const canvas = document.createElement("canvas");
    canvas.className = "ink-canvas";
    item.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let radius = 0, targetRadius = 0, time = Math.random() * 100, animId = null;
    let originX = 0.5, originY = 0.5;
    let targetOriginX = 0.5, targetOriginY = 0.5;

    // fBm noise — same algorithm as the about page WebGL shader
    function fract(x) { return x - Math.floor(x); }
    function hash(px, py) { return fract(Math.sin(px * 127.1 + py * 311.7) * 43758.5453); }
    function noise(px, py) {
      const ix = Math.floor(px), iy = Math.floor(py);
      const fx = px - ix, fy = py - iy;
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      return hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * ux
           + (hash(ix, iy + 1) - hash(ix, iy)) * uy
           + (hash(ix, iy) - hash(ix + 1, iy) - hash(ix, iy + 1) + hash(ix + 1, iy + 1)) * ux * uy;
    }
    function turbulence(px, py) {
      let t = 0, w = 0.5;
      for (let i = 0; i < 6; i++) { t += Math.abs(noise(px, py)) * w; px *= 2; py *= 2; w *= 0.5; }
      return t;
    }
    function organicR(angle, r, t) {
      const bx = Math.cos(angle) * 3 + t * 0.3;
      const by = Math.sin(angle) * 7 + t * 0.3;
      return r * (1 + (turbulence(bx, by) - 0.7) * 0.3);
    }

    function draw() {
      const w = item.offsetWidth;
      const h = img.offsetHeight || item.offsetHeight;
      if (!w || !h || !img.naturalWidth) { animId = requestAnimationFrame(draw); return; }
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);

      if (radius > 0.001) {
        const cx = originX * w, cy = originY * h;
        const maxR = Math.max(
          Math.hypot(cx, cy),
          Math.hypot(w - cx, cy),
          Math.hypot(cx, h - cy),
          Math.hypot(w - cx, h - cy)
        ) * 1.25;
        const r = radius * maxR;
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const a = (i / 80) * Math.PI * 2;
          const or = organicR(a, r, time);
          i === 0 ? ctx.moveTo(cx + Math.cos(a) * or, cy + Math.sin(a) * or)
                  : ctx.lineTo(cx + Math.cos(a) * or, cy + Math.sin(a) * or);
        }
        ctx.closePath();
        ctx.clip();
        ctx.filter = filmFilter;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = "none";
        ctx.restore();
      }

      const lerpSpeed = targetRadius > radius ? 0.0175 + radius * 0.045 : 0.1;
      radius += (targetRadius - radius) * lerpSpeed;
      originX += (targetOriginX - originX) * 0.08;
      originY += (targetOriginY - originY) * 0.08;
      time += 0.15;

      if (Math.abs(radius - targetRadius) > 0.001 || targetRadius > 0.001) {
        animId = requestAnimationFrame(draw);
      } else {
        animId = null;
      }
    }

    item.addEventListener("mouseenter", (e) => {
      const rect = item.getBoundingClientRect();
      const ex = (e.clientX - rect.left) / rect.width;
      const ey = (e.clientY - rect.top) / rect.height;
      originX = ex;
      originY = ey;
      targetOriginX = ex;
      targetOriginY = ey;
      radius = 0;
      targetRadius = 1;
      if (!animId) animId = requestAnimationFrame(draw);
    });
    item.addEventListener("mouseleave", () => {
      targetOriginX = 0.5;
      targetOriginY = 0.5;
      targetRadius = 0;
      if (!animId) animId = requestAnimationFrame(draw);
    });
  });
})();


/* ── Lightbox ── */
const items = Array.from(document.querySelectorAll(".archive-grid-item"));
const overlay = document.getElementById("lb-overlay");
const lbImg = document.getElementById("lb-img");
const lbProgress = document.getElementById("lb-progress");
let current = 0;

function updateProgress() {
  lbProgress.style.width = ((current + 1) / items.length * 100) + "%";
}
function openLightbox(index) {
  current = index;
  lbImg.src = items[current].dataset.full;
  overlay.classList.add("open");
  updateProgress();
}
function closeLightbox() {
  overlay.classList.remove("open");
}
function showPrev() {
  current = (current - 1 + items.length) % items.length;
  lbImg.src = items[current].dataset.full;
  updateProgress();
}
function showNext() {
  current = (current + 1) % items.length;
  lbImg.src = items[current].dataset.full;
  updateProgress();
}

items.forEach((item, i) => item.addEventListener("click", () => openLightbox(i)));
document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-prev").addEventListener("click", showPrev);
document.getElementById("lb-next").addEventListener("click", showNext);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeLightbox(); });
document.addEventListener("keydown", (e) => {
  if (!overlay.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showPrev();
  if (e.key === "ArrowRight") showNext();
});


/* ── Staggered IntersectionObserver fade-in ── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const item = entry.target;
      const idx = items.indexOf(item);
      const delay = Math.min(idx * 40, 600);
      setTimeout(() => item.classList.add("visible"), delay);
      observer.unobserve(item);
    }
  });
}, { threshold: 0.05 });

items.forEach((item) => observer.observe(item));
