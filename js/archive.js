/* ── Mobile detection ── */
const isMobile = () => window.matchMedia('(max-width: 991px)').matches;

/* ── Lenis smooth scroll ── */
const lenis = new Lenis(isMobile() ? { wrapper: document.body } : {});
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
initLightbox({
  items: document.querySelectorAll(".archive-grid-item"),
  getSrc: (item) => item.dataset.full
});


/* ── Scale + fade reveal with ScrollTrigger.batch ── */
gsap.registerPlugin(ScrollTrigger);

const items = document.querySelectorAll(".archive-grid-item");
gsap.set(items, { y: 24, opacity: 0 });

const entered  = new Set();
const loaded   = new Set();
const revealed = new Set();

/* ---- Archive loader ---- */
const archiveLoader = document.getElementById("archive-loader");
let loaderDismissed = false;

function dismissLoader() {
  if (loaderDismissed || !archiveLoader) return;
  loaderDismissed = true;
  archiveLoader.classList.add("is-hidden");
  archiveLoader.addEventListener("transitionend", () => {
    archiveLoader.remove();
  }, { once: true });
}

/* ---- Batched stagger queue ---- */
let staggerQueue = [];
let staggerTimer = null;
const STAGGER_DELAY = 0.06;
const BATCH_WINDOW  = 120;

function flushStaggerQueue() {
  staggerTimer = null;
  if (!staggerQueue.length) return;

  staggerQueue.sort((a, b) =>
    a.getBoundingClientRect().left - b.getBoundingClientRect().left
  );

  /* Hide loader on first reveal flush */
  dismissLoader();

  staggerQueue.forEach((item, i) => {
    if (revealed.has(item)) return;
    revealed.add(item);
    gsap.to(item, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      delay: i * STAGGER_DELAY,
      ease: "power3.out",
    });
  });

  staggerQueue = [];
}

function enqueueReveal(item) {
  if (revealed.has(item)) return;
  if (!entered.has(item) || !loaded.has(item)) return;
  staggerQueue.push(item);
  if (!staggerTimer) {
    staggerTimer = setTimeout(flushStaggerQueue, BATCH_WINDOW);
  }
}

/* ---- Image load tracking ---- */
items.forEach(item => {
  const img = item.querySelector("img");
  if (!img) return;

  if (img.complete && img.naturalHeight > 0) {
    loaded.add(item);
  } else {
    function onReady() {
      loaded.add(item);
      enqueueReveal(item);
    }
    img.addEventListener("load", onReady, { once: true });
    img.addEventListener("error", onReady, { once: true });
  }
});

/* ---- Loader safety timeout (max 4s) ---- */
setTimeout(dismissLoader, 4000);

/* ---- Scroll entry tracking ---- */
ScrollTrigger.batch(items, {
  onEnter: (batch) => {
    batch.forEach(item => {
      entered.add(item);
      enqueueReveal(item);
    });
  },
  once: true,
});
