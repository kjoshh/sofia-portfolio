/* ── Mobile detection ── */
const isMobile = () => window.matchMedia('(max-width: 991px)').matches;

/* ── Lenis smooth scroll ── */
const lenis = new Lenis(isMobile() ? { wrapper: document.body } : {});
(function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);


/* ── Webflow CMS: apply .bw class from data attribute ── */
document.querySelectorAll('.archive-grid-item[data-bw="true"]').forEach(item => {
  item.classList.add('bw');
});

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

/* Gate reveal on both viewport entry AND image loaded */
const entered = new Set();
const loaded  = new Set();

function revealItem(item, delay) {
  if (entered.has(item) && loaded.has(item)) {
    gsap.to(item, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      delay: delay || 0,
      ease: "power3.out",
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
      revealItem(item, 0);
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
      const staggerDelay = i * 0.06;
      /* store delay so the load callback can use it */
      item._revealDelay = staggerDelay;
      gsap.delayedCall(staggerDelay, () => revealItem(item, 0));
    });
  },
  once: true,
});
