/* ── Lenis smooth scroll ── */
const isMobile = window.matchMedia('(max-width: 991px)').matches;
const lenis = new Lenis(isMobile ? { wrapper: document.body } : {});
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
        ease: "power4.inOut",
        onUpdate: draw
      });
    });
    item.addEventListener("mouseleave", () => {
      if (tween) tween.kill();
      tween = gsap.to(state, {
        progress: 0,
        duration: 0.4,
        ease: "power4.inOut",
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
const lbCounterCurrent = document.querySelector(".lb-counter-current");
const lbCounterTotal = document.querySelector(".lb-counter-total");
let current = 0;

if (lbCounterTotal) lbCounterTotal.textContent = String(items.length).padStart(2, "0");

function updateProgress() {
  lbProgress.style.width = ((current + 1) / items.length * 100) + "%";
  if (lbCounterCurrent) {
    gsap.to(lbCounterCurrent, {
      opacity: 0, duration: 0.1, ease: "power2.in",
      onComplete: () => {
        lbCounterCurrent.textContent = String(current + 1).padStart(2, "0");
        gsap.to(lbCounterCurrent, { opacity: 1, duration: 0.12, ease: "power2.out" });
      }
    });
  }
}
function openLightbox(index) {
  current = index;
  lbImg.src = items[current].dataset.full;
  overlay.classList.add("open");
  if (lbCounterCurrent) lbCounterCurrent.textContent = String(current + 1).padStart(2, "0");
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

/* ── Lightbox swipe ── */
let lbTouchStartX = 0;
let lbTouchStartY = 0;
overlay.addEventListener("touchstart", (e) => {
  lbTouchStartX = e.changedTouches[0].clientX;
  lbTouchStartY = e.changedTouches[0].clientY;
}, { passive: true });
overlay.addEventListener("touchend", (e) => {
  if (!overlay.classList.contains("open")) return;
  const dx = e.changedTouches[0].clientX - lbTouchStartX;
  const dy = e.changedTouches[0].clientY - lbTouchStartY;
  if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
  if (dx < 0) showNext();
  else showPrev();
});


/* ── Scale + fade reveal with ScrollTrigger.batch ── */
gsap.registerPlugin(ScrollTrigger);
gsap.set(items, { scale: 0.92, opacity: 0 });

/* Gate reveal on both viewport entry AND image loaded */
const entered = new Set();
const loaded = new Set();

function revealItem(item) {
  if (entered.has(item) && loaded.has(item)) {
    gsap.to(item, {
      scale: 1,
      opacity: 1,
      duration: 0.9,
      ease: "power2.out",
    });
  }
}

items.forEach(item => {
  const img = item.querySelector("img");
  if (!img) return;
  if (img.complete && img.naturalHeight > 0) {
    loaded.add(item);
  } else {
    img.addEventListener("load", () => {
      loaded.add(item);
      revealItem(item);
    }, { once: true });
  }
});

ScrollTrigger.batch(items, {
  onEnter: (batch) => {
    batch.sort((a, b) =>
      a.getBoundingClientRect().left - b.getBoundingClientRect().left
    );
    batch.forEach((item, i) => {
      entered.add(item);
      /* stagger via delay to keep the sweep effect */
      gsap.delayedCall(i * 0.07, () => revealItem(item));
    });
  },
  once: true,
});
