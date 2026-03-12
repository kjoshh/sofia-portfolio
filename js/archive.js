/* ── Lenis smooth scroll ── */
const lenis = new Lenis();
(function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);


/* ── Film-negative wipe: bottom → top on hover ── */
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

    const state = { progress: 0 };
    let tween = null;

    function draw() {
      const w = item.offsetWidth;
      const h = img.offsetHeight || item.offsetHeight;
      if (!w || !h || !img.naturalWidth) return;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);

      if (state.progress > 0) {
        const revealH = state.progress * h;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, h - revealH, w, revealH);
        ctx.clip();
        ctx.filter = filmFilter;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = "none";
        ctx.restore();
      }
    }

    item.addEventListener("mouseenter", () => {
      if (tween) tween.kill();
      tween = gsap.to(state, {
        progress: 1,
        duration: 0.55,
        ease: "power2.inOut",
        onUpdate: draw
      });
    });
    item.addEventListener("mouseleave", () => {
      if (tween) tween.kill();
      tween = gsap.to(state, {
        progress: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onUpdate: draw
      });
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
