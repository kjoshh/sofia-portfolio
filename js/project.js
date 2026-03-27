/* ── Mobile detection ── */
const isMobile = () => window.matchMedia('(max-width: 991px)').matches;

/* ── Overview cell height: all images fit in viewport ── */
// Measure safe-area-inset-bottom for viewport calculations
const _sabEl = document.createElement('div');
_sabEl.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden';
document.body.appendChild(_sabEl);
const _safeAreaBottom = _sabEl.offsetHeight;
_sabEl.remove();

function updateOverviewCellHeight() {
  const imgCount = document.querySelectorAll(".imgholder").length;
  if (imgCount === 0) return;
  const grid = document.querySelector(".gall3ry");

  if (window.innerWidth <= 991) {
    const gap = 8;
    const availH = window.innerHeight - 88 - 120 - _safeAreaBottom; // below mob-sheet, above tab pill + safe area
    // Find minimum cols so cell height >= 70px
    let bestCols = 2;
    for (let c = 2; c <= 6; c++) {
      bestCols = c;
      const rows = Math.ceil(imgCount / c);
      if ((availH - gap * (rows - 1)) / rows >= 70) break;
    }
    const rows = Math.ceil(imgCount / bestCols);
    const cellH = (availH - gap * (rows - 1)) / rows;
    document.querySelector(".gall3ry-container").style.setProperty("--overview-cell-h", cellH + "px");
    if (grid) grid.style.gridTemplateColumns = `repeat(${bestCols}, 1fr)`;
  } else {
    const cols = 5;
    const rows = Math.ceil(imgCount / cols);
    const gap = 10;
    const padTop = 88;    // nav bottom (~68px) + 20px gap
    const padBot = 110;   // pro-nav clearance (~90px from bottom) + 20px gap
    const availH = window.innerHeight - padTop - padBot;
    const cellH = (availH - gap * (rows - 1)) / rows;
    document.querySelector(".gall3ry-container").style.setProperty("--overview-cell-h", cellH + "px");
    if (grid) grid.style.gridTemplateColumns = "";
  }
}
updateOverviewCellHeight();
window.addEventListener("resize", updateOverviewCellHeight);


/* ── Imgholder cursor grow (overview layout only) ── */
const cursor = document.getElementById("cursor");
if (cursor) {
  document.querySelectorAll(".imgholder").forEach(el => {
    el.addEventListener("mouseenter", () => {
      if (typeof activeLayout !== "undefined" && activeLayout === "layout-1-gall3ry") {
        cursor.classList.add("hover");
      }
    });
    el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
  });
}


/* ── Lenis smooth scroll ── */
let lenis = null;
if (typeof Lenis !== 'undefined') {
  lenis = new Lenis(isMobile() ? { wrapper: document.body } : {});
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}


/* ── GSAP setup ── */
const plugins = [typeof Flip !== 'undefined' && Flip, typeof CustomEase !== 'undefined' && CustomEase, typeof ScrollToPlugin !== 'undefined' && ScrollToPlugin].filter(Boolean);
if (plugins.length) gsap.registerPlugin(...plugins);
if (typeof CustomEase !== 'undefined') {
  CustomEase.create(
    "hop",
    "M0,0 C0.028,0.528 0.129,0.74 0.27,0.852 0.415,0.967 0.499,1 1,1"
  );
}


/* ── Layout switching ── */
const items = document.querySelectorAll(".nav-link");
const gall3ry = document.querySelector(".gall3ry");
const gall3ryContainer = document.querySelector(".gall3ry-container");
const img100 = document.getElementById("img100");
const textContainer = document.querySelector(".text-container");
const proNav = document.querySelector(".pro-nav");

// Webflow CMS Rich Text: add .info-para class to all <p> inside .text-container
if (textContainer) {
  textContainer.querySelectorAll("p:not(.info-para)").forEach(p => p.classList.add("info-para"));
}
const infoParas = document.querySelectorAll(".info-para");

// Temporarily show container so SplitText can measure rendered lines
const infoLines = [];
if (textContainer && typeof SplitText !== 'undefined') {
  textContainer.style.visibility = "hidden";
  textContainer.style.display = "block";
  infoParas.forEach(p => {
    const split = new SplitText(p, { type: "lines" });
    p.style.maxWidth = "";
    infoLines.push(...split.lines);
  });
  gsap.set(infoLines, { opacity: 0, y: 10 });
  infoParas.forEach(p => { p.style.visibility = "visible"; });
  textContainer.style.display = "none";
}
textContainer.style.visibility = "";

// Compute nav Y offset for layout-0: position nav just below the centered image cluster
function getLayout0NavY() {
  // #img100 is 235px wide, rotated 90deg → visual height ≈ 235px
  const clusterHalfH = 235 / 2;
  const gap = -10;
  // Nav base is at bottom:45px; shift it so it sits (gap)px below the centered cluster
  return -(window.innerHeight * 0.57) + clusterHalfH + gap + 45;
}

// Compute mob-proj-tabs Y offset for layout-0: position tabs just below the centered cluster
function getMobTabsLayout0Y() {
  // Cluster center is at 38% from top. Film roll width is responsive via clamp.
  const vw = window.innerWidth;
  const rollWidth = Math.min(180, Math.max(140, vw * 0.22));
  const clusterBottom = window.innerHeight * 0.38 + rollWidth / 2;
  // Tabs natural position: bottom: 24px → top = innerHeight - 24 - tabsHeight
  const mobProjTabs = document.getElementById("mobProjTabs");
  const tabsH = mobProjTabs ? mobProjTabs.offsetHeight : 70;
  const tabsNaturalTop = window.innerHeight - 16 - tabsH;
  // Negative Y to pull tabs up from their fixed-bottom position
  const gap = 10;
  return -(tabsNaturalTop - clusterBottom - gap);
}

if (!isMobile()) {
  gsap.set(proNav, { xPercent: -50, y: getLayout0NavY(), yPercent: 50 });
  proNav.classList.add("transparent");
} else {
  const mobProjTabs = document.getElementById("mobProjTabs");
  if (mobProjTabs) {
    mobProjTabs.classList.add("layout-0-tabs");
    gsap.set(mobProjTabs, { y: getMobTabsLayout0Y() });
  }
}
let activeLayout = "layout-0-gall3ry";

// Reposition nav on resize when in layout-0
window.addEventListener("resize", () => {
  if (activeLayout === "layout-0-gall3ry" && !isMobile()) {
    gsap.set(proNav, { y: getLayout0NavY() });
  }
});


/* ── Entrance reveal animation ── */
(function entranceReveal() {
  const imgholders = Array.from(gall3ry.querySelectorAll(".imgholder"));

  // Custom eases
  CustomEase.create(
    "reveal",
    "M0,0 C0.12,0.72 0.25,1.06 0.45,1.06 0.65,1.06 0.78,1 1,1"
  );
  CustomEase.create(
    "clipReveal",
    "M0,0 C0.25,0.46 0.45,0.94 1,1"
  );

  if (!isMobile()) {
    /* ── Desktop timeline ── */
    const tl = gsap.timeline({ delay: 0.25 });

    // Step 1: Hero fade + gentle zoom-out
    gsap.set(img100, { scale: 1.25, opacity: 0 });
    tl.to(img100, {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: "clipReveal",
    }, 0);

    // Step 2: Gallery images stagger in
    tl.fromTo(imgholders,
      { opacity: 0, scale: 0.6 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        stagger: { each: 0.06, from: "center" },
        ease: "reveal",
      },
      "-=0.5"
    );

    // Step 3: Pro-nav blur-to-sharp rack-focus reveal
    const proNavLinks = proNav.querySelectorAll(".nav-link");
    tl.fromTo(proNav,
      { opacity: 0, y: getLayout0NavY(), filter: "blur(8px)" },
      {
        opacity: 1,
        filter: "blur(0px)",
        y: getLayout0NavY(),
        duration: 0.6,
        ease: "clipReveal",
      },
      "-=0.6"
    );

    // Cleanup: mark body so CSS overrides initial hidden states, then clear GSAP inline styles
    tl.call(() => {
      document.body.classList.add("entrance-revealed");
      gsap.set(imgholders, { clearProps: "all" });
      gsap.set(img100, { clearProps: "scale,opacity" });
      // Re-apply GSAP-managed proNav positioning (these are not CSS-managed)
      gsap.set(proNav, { xPercent: -50, y: getLayout0NavY(), yPercent: 50, opacity: 1, clearProps: "filter" });
    });

  } else {
    /* ── Mobile timeline (layout-0 landing) ── */
    const mobSheet = document.getElementById("mobSheet");
    const mobProjTabs = document.getElementById("mobProjTabs");
    const tl = gsap.timeline({ delay: 0.2 });

    // Step 1: Film roll fade-in + gentle zoom
    gsap.set(img100, { scale: 1.15, opacity: 0 });
    tl.to(img100, {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: "clipReveal",
    }, 0);

    // Step 2: Gallery images stagger in from center
    tl.fromTo(imgholders,
      { opacity: 0, scale: 0.5 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: { each: 0.05, from: "center" },
        ease: "reveal",
      },
      0.3
    );

    // Step 3: Mob-sheet slides down
    if (mobSheet) {
      tl.fromTo(mobSheet,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
        0.5
      );
    }

    // Step 4: Mob-proj-tabs fade up into cluster position
    if (mobProjTabs) {
      const tabsY = getMobTabsLayout0Y();
      tl.fromTo(mobProjTabs,
        { opacity: 0, y: tabsY + 15 },
        { opacity: 1, y: tabsY, duration: 0.5, ease: "power3.out" },
        0.6
      );
    }

    // Cleanup
    tl.call(() => {
      document.body.classList.add("entrance-revealed");
      gsap.set(imgholders, { clearProps: "all" });
      gsap.set(img100, { clearProps: "scale,opacity" });
      if (mobSheet) gsap.set(mobSheet, { clearProps: "opacity,y" });
      // Keep tabs Y offset — don't clear it
    });
  }

  // bfcache: on back-nav, show everything immediately (no animation)
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      document.body.classList.add("entrance-revealed");
      gsap.set(img100, { clearProps: "opacity,scale" });
      gsap.set(imgholders, { clearProps: "all" });
      if (!isMobile()) {
        gsap.set(proNav, { opacity: 1, xPercent: -50, y: getLayout0NavY(), yPercent: 50 });
      } else {
        const mobProjTabs = document.getElementById("mobProjTabs");
        if (mobProjTabs && activeLayout === "layout-0-gall3ry") {
          mobProjTabs.classList.add("layout-0-tabs");
          gsap.set(mobProjTabs, { y: getMobTabsLayout0Y() });
        }
      }
    }
  });
})();


function switchLayout(newLayout) {
  if (newLayout === activeLayout) return;
  if (activeLayout === "layout-2-gall3ry" && lenis && lenis.scroll > 0) {
    lenis.scrollTo(0, {
      duration: 0.6,
      easing: t => 1 - Math.pow(1 - t, 3),
      onComplete: () => switchLayoutHandler(newLayout),
    });
  } else if (isMobile() && newLayout === "layout-2-gall3ry" && lenis && lenis.scroll > 0) {
    // Entering sequence on mobile with scroll > 0: reset instantly before transition
    lenis.scrollTo(0, { immediate: true });
    switchLayoutHandler(newLayout);
  } else {
    switchLayoutHandler(newLayout);
  }
}

function switchLayoutHandler(newLayout) {
  const previousLayout = activeLayout;
  activeLayout = newLayout;
  const imgholders = Array.from(gall3ry.querySelectorAll(".imgholder"));

  // Sequence counter: show/hide based on layout
  if (window._seqCounter) {
    if (newLayout === "layout-2-gall3ry" && !isMobile()) {
      window._seqCounter.show();
    } else {
      window._seqCounter.hide();
    }
  }

  // Kill any in-progress animations and clear all stale inline styles before Flip measures
  gsap.killTweensOf(imgholders);
  gsap.set(imgholders, { clearProps: "all" });

  // Safety: if a previous transition was interrupted mid-Flip, Lenis may still be stopped
  // and container may still have a stale inline height lock. Clean up before proceeding.
  const container = document.querySelector(".gall3ry-container");
  const isMob = isMobile();
  if (isMob) {
    if (lenis) lenis.start();
    container.style.height = "";
    container.style.overflow = "";
  }

  // On mobile, leaving Info tab: images are display:none so there's no Flip "from" position.
  // Fade text out immediately, delay class change so images only appear after text clears.
  if (isMobile() && previousLayout === "layout-3-gall3ry") {
    if (textContainer) {
      gsap.killTweensOf(infoLines);
      gsap.to(infoLines, {
        opacity: 0, y: 10, duration: 0.2,
        stagger: { each: 0.02, from: "end" }, ease: "power2.in",
        onComplete: () => {
          gsap.set(infoLines, { opacity: 0, y: 10 });
          textContainer.style.display = "none";
          gsap.set(textContainer, { autoAlpha: 0 });
        }
      });
    }
    setTimeout(() => {
      gall3ry.classList.remove(previousLayout);
      gall3ry.classList.add(newLayout);
      proNav.classList.remove("transparent");
      gsap.fromTo(imgholders,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, stagger: 0.03, ease: "power2.out", onComplete: () => { if (lenis) lenis.resize(); } }
      );
    }, 350);
    return;
  }

  // On mobile/tablet, entering Info tab: skip Flip so inline styles don't override CSS display:none
  if (isMobile() && newLayout === "layout-3-gall3ry") {
    if (previousLayout === "layout-0-gall3ry") {
      gsap.set(img100, { opacity: 0 });
      const mobProjTabs = document.getElementById("mobProjTabs");
      if (mobProjTabs) {
        mobProjTabs.classList.remove("layout-0-tabs");
        gsap.fromTo(mobProjTabs,
          { background: "transparent", borderColor: "transparent", padding: "0px 0px 0px" },
          {
            background: "rgba(15, 13, 11, 0.96)",
            borderColor: "rgba(233, 229, 221, 0.07)",
            padding: "8px 8px 6px",
            y: 0,
            duration: 1.2,
            ease: "power3.inOut",
            clearProps: "background,borderColor,padding",
          }
        );
      }
    }
    gsap.to(imgholders, {
      opacity: 0, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        gall3ry.classList.remove(previousLayout);
        gall3ry.classList.add(newLayout);
        gsap.set(imgholders, { clearProps: "all" });
        proNav.classList.remove("transparent");
        if (textContainer) {
          textContainer.style.display = "block";
          gsap.set(textContainer, { autoAlpha: 1 });
          gsap.fromTo(infoLines,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" }
          );
        }
        if (lenis) lenis.resize();
      }
    });
    return;
  }

  // Hide img100 instantly before class swap to prevent position jump
  if (previousLayout === "layout-0-gall3ry") {
    gsap.set(img100, { opacity: 0 });
  }

  // Lock container height on mobile before class swap to prevent layout collapse
  // during Flip animation (absolute: true takes images out of flow)
  const needsHeightLock = isMob && (
    previousLayout === "layout-0-gall3ry" ||
    newLayout === "layout-2-gall3ry"
  );
  if (needsHeightLock) {
    container.style.height = container.offsetHeight + "px";
    container.style.overflow = "hidden";
  }

  const state = Flip.getState(imgholders);
  gall3ry.classList.remove(previousLayout);
  gall3ry.classList.add(newLayout);

  // Recalculate cell height on mobile so grid targets are accurate before Flip measures
  if (isMob && newLayout === "layout-1-gall3ry") {
    updateOverviewCellHeight();
  }

  let staggerOption = 0.025;
  if (previousLayout === "layout-1-gall3ry" && newLayout === "layout-2-gall3ry") {
    staggerOption = { duration: 2, each: 0.05, from: "end", ease: "power3.Out" };
  }
  if (previousLayout === "layout-0-gall3ry") {
    staggerOption = { each: 0.05, from: "end" };
  }

  const flipEase = (previousLayout === "layout-0-gall3ry" && newLayout === "layout-2-gall3ry")
    ? "power1.inOut"
    : "hop";

  // Stop Lenis during Flip on mobile to prevent scroll jitter
  if (isMob && lenis) lenis.stop();

  Flip.from(state, {
    duration: 1.75,
    ease: flipEase,
    stagger: staggerOption,
    absolute: true,
    onComplete: () => {
      // Delay unlock to next frame so browser finishes Flip's last paint first
      requestAnimationFrame(() => {
        if (needsHeightLock) {
          container.style.height = "";
          container.style.overflow = "";
        }
        if (isMob) lenis.start();
        if (lenis) lenis.resize();
      });
    }
  });

  // Animate mob-proj-tabs down to fixed position + pill in when leaving layout-0
  if (previousLayout === "layout-0-gall3ry" && isMobile()) {
    const mobProjTabs = document.getElementById("mobProjTabs");
    if (mobProjTabs) {
      // Remove bare class so pill styles apply, then animate bg/border from transparent
      mobProjTabs.classList.remove("layout-0-tabs");
      gsap.fromTo(mobProjTabs,
        { background: "transparent", borderColor: "transparent", padding: "0px 0px 0px" },
        {
          background: "rgba(15, 13, 11, 0.96)",
          borderColor: "rgba(233, 229, 221, 0.07)",
          padding: "8px 8px 6px",
          y: 0,
          duration: 1.2,
          ease: "power3.inOut",
          clearProps: "background,borderColor,padding",
        }
      );
    }
  }

  if (previousLayout === "layout-0-gall3ry") {
    if (!isMobile()) {
      gsap.to(proNav, { xPercent: -50, y: 0, yPercent: 0, duration: 2, ease: "power4.inOut", delay: 0 });
      // Animate background in smoothly instead of instant class toggle
      proNav.classList.remove("transparent");
      gsap.fromTo(proNav,
        { backgroundColor: "rgba(15, 13, 11, 0)" },
        { backgroundColor: "rgba(15, 13, 11, 0.96)", duration: 0.8, ease: "power2.inOut", delay: 1.4 }
      );
    } else {
      proNav.classList.remove("transparent");
    }
  }
  if (newLayout === "layout-0-gall3ry") {
    gsap.to(img100, { opacity: 1, duration: 0.5, ease: "power4.inOut", delay: 0 });
    if (!isMobile()) {
      gsap.to(proNav, { xPercent: -50, y: getLayout0NavY(), yPercent: 50, duration: 2, ease: "power4.inOut", delay: 0 });
      // Animate background out smoothly, then apply transparent class
      gsap.to(proNav, {
        backgroundColor: "rgba(15, 13, 11, 0)",
        duration: 0.6, ease: "power2.inOut", delay: 1.2,
        onComplete: () => {
          proNav.classList.add("transparent");
          gsap.set(proNav, { clearProps: "backgroundColor" });
        }
      });
    } else {
      proNav.classList.add("transparent");
    }
  } else if (previousLayout !== "layout-0-gall3ry") {
    proNav.classList.remove("transparent");
  }

  if (newLayout === "layout-3-gall3ry") {
    if (textContainer) {
      textContainer.style.display = "block";
      gsap.set(textContainer, { autoAlpha: 1 });
      gsap.fromTo(infoLines,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, delay: 0.25, ease: "power2.out" }
      );
    }
  } else {
    if (textContainer) {
      gsap.killTweensOf(infoLines);
      gsap.to(infoLines, {
        opacity: 0, y: 10,
        duration: 0.2,
        stagger: { each: 0.02, from: "end" },
        ease: "power2.in",
        onComplete: () => {
          gsap.set(infoLines, { opacity: 0, y: 10 });
          textContainer.style.display = "none";
          gsap.set(textContainer, { autoAlpha: 0 });
        }
      });
    }
  }
}

document.querySelector(".nav-link.project").addEventListener("click", (e) => {
  e.preventDefault();
  updateProNavActive(document.querySelector(".nav-link.project"));
  switchLayout("layout-0-gall3ry");
  proNav.classList.add("transparent");
});

items.forEach((item) => {
  item.addEventListener("click", () => {
    if (!item.id) return;
    updateProNavActive(item);
    switchLayout(item.id);
  });
});




/* ── Font stagger + active/notactive + cross-hover on pro-nav (mirrors main nav) ── */
const proNavEls = [
  ...document.querySelectorAll(".pro-nav .nav-link"),
  document.querySelector(".nav-link.project"),
].filter(Boolean);

proNavEls.forEach(el => {
  el._isCurrentPage = false;
  applyFontStagger(el);
});


function updateProNavActive(activeEl) {
  proNavEls.forEach(el => {
    el._isCurrentPage = el === activeEl;
    if (el._staggerOff) el._staggerOff();
    if (el === activeEl) {
      el.classList.add("active");
      el.classList.remove("notactive");
    } else {
      el.classList.add("notactive");
      el.classList.remove("active");
    }
  });
}

// layout-0 is active on load — set post-font instantly, no animation
(function () {
  const logoEl = document.querySelector(".nav-link.project");
  proNavEls.forEach(el => {
    el._isCurrentPage = el === logoEl;
    if (el === logoEl) {
      el.classList.add("active");
      el.classList.remove("notactive");
    } else {
      el.classList.add("notactive");
      el.classList.remove("active");
    }
  });
})();


/* ── Webflow CMS: copy project title to mob-proj-title ── */
(function () {
  const titleSrc = document.querySelector(".nav-link.project");
  const titleDst = document.querySelector(".mob-proj-title");
  if (titleSrc && titleDst && !titleDst.textContent.trim()) {
    titleDst.textContent = titleSrc.textContent.trim();
  }
})();

/* ── Lightbox (overview layout) ── */
initLightbox({
  items: document.querySelectorAll(".imgholder"),
  getSrc: (holder) => holder.querySelector("img").src,
  canOpen: () => activeLayout === "layout-1-gall3ry"
});


/* ── Mobile: keep layout-0 as initial landing, wire mob-proj-tabs ── */
if (isMobile()) {
  // Clear default active tab — no tab is active in layout-0
  document.querySelectorAll(".mob-proj-tab").forEach(b => b.classList.remove("active"));
}

document.querySelectorAll(".mob-proj-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const layout = btn.dataset.layout;
    switchLayout(layout);
    document.querySelectorAll(".mob-proj-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});


/* ── Sequence counter (film strip frame indicator) ── */
(function seqCounter() {
  const counter = document.getElementById("seqCounter");
  if (!counter) return;

  const currentSpan = counter.querySelector(".seq-counter-current");
  const totalSpan = counter.querySelector(".seq-counter-total");
  const imgholders = Array.from(gall3ry.querySelectorAll(".imgholder"));
  let observer = null;
  let currentIndex = 0;

  function pad(n) { return String(n).padStart(2, "0"); }

  // Set total count
  totalSpan.textContent = pad(imgholders.length);

  function updateCurrent(newIndex) {
    if (newIndex === currentIndex && counter.classList.contains("visible")) return;
    currentIndex = newIndex;
    gsap.to(currentSpan, {
      opacity: 0,
      duration: 0.12,
      ease: "power2.in",
      onComplete: () => {
        currentSpan.textContent = pad(currentIndex + 1);
        gsap.to(currentSpan, { opacity: 1, duration: 0.15, ease: "power2.out" });
      }
    });
  }

  const ratios = new Map();

  function createObserver() {
    if (observer) observer.disconnect();
    ratios.clear();
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const idx = imgholders.indexOf(entry.target);
        if (idx !== -1) ratios.set(idx, entry.intersectionRatio);
      });
      let bestIndex = 0;
      let bestRatio = 0;
      ratios.forEach((ratio, idx) => {
        if (ratio > bestRatio) { bestRatio = ratio; bestIndex = idx; }
      });
      updateCurrent(bestIndex);
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    imgholders.forEach(el => observer.observe(el));
  }

  function show() {
    currentIndex = 0;
    currentSpan.textContent = pad(1);
    totalSpan.textContent = pad(imgholders.length);
    createObserver();
    counter.classList.add("visible");
  }

  function hide() {
    counter.classList.remove("visible");
    if (observer) { observer.disconnect(); observer = null; }
  }

  // Expose for switchLayout integration
  window._seqCounter = { show, hide };

  // If mobile starts in layout-2, show immediately
  if (activeLayout === "layout-2-gall3ry" && !isMobile()) show();
})();
