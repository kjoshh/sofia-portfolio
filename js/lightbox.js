/* ── Shared Lightbox ──
   Usage: initLightbox({ items, getSrc, canOpen? })
   - items:   NodeList or Array of clickable elements
   - getSrc:  (item, index) => image URL string
   - canOpen: optional guard — (index) => boolean
*/
function initLightbox({ items, getSrc, canOpen }) {
  const overlay = document.getElementById("lb-overlay");
  const lbImg = document.getElementById("lb-img");
  const lbSpinner = document.getElementById("lb-spinner");
  const lbCounterCurrent = document.querySelector(".lb-counter-current");
  const lbCounterTotal = document.querySelector(".lb-counter-total");
  if (!overlay || !lbImg) return;

  const list = Array.from(items);
  let current = 0;
  let previousFocus = null;
  const preloadCache = new Map();
  let spinnerTimer = null;

  /* Focusable elements inside the lightbox for focus-trapping */
  const focusableEls = overlay.querySelectorAll('button');
  const firstFocusable = focusableEls[0];
  const lastFocusable = focusableEls[focusableEls.length - 1];

  if (lbCounterTotal) lbCounterTotal.textContent = String(list.length).padStart(2, "0");

  function updateProgress() {
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

  /* ── Loading state ── */
  function showLoading() {
    lbImg.classList.add("loading");
    if (lbSpinner) {
      clearTimeout(spinnerTimer);
      spinnerTimer = setTimeout(() => lbSpinner.classList.add("visible"), 150);
    }
  }

  function hideLoading() {
    lbImg.classList.remove("loading");
    if (lbSpinner) {
      clearTimeout(spinnerTimer);
      lbSpinner.classList.remove("visible");
    }
  }

  /* ── Preload adjacent images ── */
  function preloadAdjacent(index) {
    [-2, -1, 1, 2].forEach(offset => {
      const i = (index + offset + list.length) % list.length;
      const src = getSrc(list[i], i);
      if (!preloadCache.has(src)) {
        const img = new Image();
        img.src = src;
        preloadCache.set(src, img);
      }
    });
  }

  /* ── Show image with loading handling ── */
  function showImage(index) {
    const src = getSrc(list[index], index);
    showLoading();
    lbImg.onload = () => {
      hideLoading();
      lbImg.onload = null;
    };
    lbImg.src = src;
    // If already cached, onload fires synchronously or instantly
    if (lbImg.complete) hideLoading();
    preloadAdjacent(index);
  }

  function open(index) {
    current = index;
    showImage(current);
    previousFocus = document.activeElement;
    overlay.classList.add("open");
    if (lbCounterCurrent) lbCounterCurrent.textContent = String(current + 1).padStart(2, "0");
    updateProgress();
    /* Move focus into lightbox */
    if (firstFocusable) firstFocusable.focus();
  }

  function close() {
    overlay.classList.remove("open");
    hideLoading();
    /* Restore focus to the element that opened the lightbox */
    if (previousFocus) { previousFocus.focus(); previousFocus = null; }
  }

  function prev() {
    current = (current - 1 + list.length) % list.length;
    showImage(current);
    updateProgress();
  }

  function next() {
    current = (current + 1) % list.length;
    showImage(current);
    updateProgress();
  }

  /* Click handlers */
  list.forEach((item, i) => {
    item.addEventListener("click", () => {
      if (canOpen && !canOpen(i)) return;
      open(i);
    });
  });

  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-prev").addEventListener("click", prev);
  document.getElementById("lb-next").addEventListener("click", next);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  /* Keyboard */
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    /* Focus trap: keep Tab within lightbox buttons */
    if (e.key === "Tab" && focusableEls.length) {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) { e.preventDefault(); lastFocusable.focus(); }
      } else {
        if (document.activeElement === lastFocusable) { e.preventDefault(); firstFocusable.focus(); }
      }
    }
  });

  /* Touch swipe */
  let touchStartX = 0;
  let touchStartY = 0;
  overlay.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  overlay.addEventListener("touchend", (e) => {
    if (!overlay.classList.contains("open")) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) next();
    else prev();
  });
}
