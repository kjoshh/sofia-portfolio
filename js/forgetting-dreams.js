/* ── Imgholder cursor grow (overview layout only) ── */
const cursor = document.getElementById("cursor");
document.querySelectorAll(".imgholder").forEach(el => {
  el.addEventListener("mouseenter", () => {
    if (typeof activeLayout !== "undefined" && activeLayout === "layout-1-gall3ry") {
      cursor.classList.add("hover");
    }
  });
  el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
});


/* ── Lenis smooth scroll ── */
const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);


/* ── GSAP setup ── */
gsap.registerPlugin(Flip, CustomEase, ScrollToPlugin);
CustomEase.create(
  "hop",
  "M0,0 C0.028,0.528 0.129,0.74 0.27,0.852 0.415,0.967 0.499,1 1,1"
);


/* ── Layout switching ── */
const items = document.querySelectorAll(".nav-link");
const gall3ry = document.querySelector(".gall3ry");
const gall3ryContainer = document.querySelector(".gall3ry-container");
const img100 = document.getElementById("img100");
const textContainer = document.querySelector(".text-container");
const infoParas = document.querySelectorAll(".info-para");
const proNav = document.querySelector(".pro-nav");

// Temporarily show container so SplitText can measure rendered lines
textContainer.style.visibility = "hidden";
textContainer.style.display = "block";
const infoLines = [];
infoParas.forEach(p => {
  const split = new SplitText(p, { type: "lines" });
  p.style.maxWidth = "";
  infoLines.push(...split.lines);
});
gsap.set(infoLines, { opacity: 0, y: 10 });
textContainer.style.display = "none";
textContainer.style.visibility = "";

gsap.set(proNav, { xPercent: -50, y: "-44vh", yPercent: 50 });
proNav.classList.add("transparent");
let activeLayout = "layout-0-gall3ry";

function switchLayout(newLayout) {
  if (newLayout === activeLayout) return;
  if (activeLayout === "layout-2-gall3ry" && lenis.scroll > 0) {
    lenis.scrollTo(0, {
      duration: 0.6,
      easing: t => 1 - Math.pow(1 - t, 3),
      onComplete: () => switchLayoutHandler(newLayout),
    });
  } else {
    switchLayoutHandler(newLayout);
  }
}

function switchLayoutHandler(newLayout) {
  const previousLayout = activeLayout;
  const imgholders = Array.from(gall3ry.querySelectorAll(".imgholder"));

  // Kill any in-progress animations and clear all stale inline styles before Flip measures
  gsap.killTweensOf(imgholders);
  gsap.set(imgholders, { clearProps: "all" });

  const state = Flip.getState(imgholders);
  gall3ry.classList.remove(activeLayout);
  gall3ry.classList.add(newLayout);

  let staggerOption = 0.025;
  if (previousLayout === "layout-1-gall3ry" && newLayout === "layout-2-gall3ry") {
    staggerOption = {duration:2, each: 0.05, from: "end", ease: "power3.Out" };
  }
  if (previousLayout === "layout-0-gall3ry") {
    staggerOption = { each: 0.05, from: "end" };
  }


  const flipEase = (previousLayout === "layout-0-gall3ry" && newLayout === "layout-2-gall3ry")
    ? "power1.inOut"
    : "hop";

  Flip.from(state, {
    duration: 1.75,
    ease: flipEase,
    stagger: staggerOption,
    absolute: true,
    onComplete: () => { lenis.resize(); }
  });

  if (previousLayout === "layout-0-gall3ry") {
    gsap.to(img100, { opacity: 0, duration: 0.2, ease: "power4.inOut", delay: 0 });
    gsap.to(proNav, { xPercent: -50, y: 0, yPercent: 0, duration: 2, ease: "power4.inOut", delay: 0 });
  }
  if (newLayout === "layout-0-gall3ry") {
    gsap.to(img100, { opacity: 1, duration: 0.5, ease: "power4.inOut", delay: 0 });
    gsap.to(proNav, { xPercent: -50, y: "-45vh", yPercent: 50, duration: 2, ease: "power4.inOut", delay: 0 });
    proNav.classList.add("transparent");
  } else {
    proNav.classList.remove("transparent");
  }

  activeLayout = newLayout;

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

document.querySelector(".logotext.project").addEventListener("click", (e) => {
  e.preventDefault();
  items.forEach(i => i.classList.remove("active"));
  switchLayout("layout-0-gall3ry");
  proNav.classList.add("transparent");
});

items.forEach((item) => {
  item.addEventListener("click", () => {
    if (!item.id) return;
    items.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    switchLayout(item.id);
  });
});


/* ── Hover preview ── */
const hoverPreview = document.getElementById("hover-preview");
const hoverPreviewImg = hoverPreview.querySelector("img");

gsap.set(hoverPreview, { xPercent: -50, yPercent: -50 });

const leftTo = gsap.quickTo(hoverPreview, "left", { duration: 0.6, ease: "power3.out" });
const topTo  = gsap.quickTo(hoverPreview, "top",  { duration: 0.6, ease: "power3.out" });

window.addEventListener("mousemove", (e) => {
  if (activeLayout !== "layout-1-gall3ry") return;
  leftTo(e.clientX);
  topTo(e.clientY);
});


/* ── Font stagger on layout nav hover (applyFontStagger is global from nav.js) ── */
[
  ...document.querySelectorAll(".pro-nav .nav-link"),
  document.querySelector(".logotext.project"),
].forEach(applyFontStagger);


/* ── Lightbox (overview layout) ── */
const lbHolders = Array.from(document.querySelectorAll(".imgholder"));
const lbOverlay  = document.getElementById("lb-overlay");
const lbImg      = document.getElementById("lb-img");
const lbProgress = document.getElementById("lb-progress");
let lbCurrent = 0;

function lbUpdateProgress() {
  lbProgress.style.width = ((lbCurrent + 1) / lbHolders.length * 100) + "%";
}
function lbOpen(index) {
  lbCurrent = index;
  lbImg.src = lbHolders[lbCurrent].querySelector("img").src;
  lbOverlay.classList.add("open");
  lbUpdateProgress();
}
function lbClose() { lbOverlay.classList.remove("open"); }
function lbPrev() {
  lbCurrent = (lbCurrent - 1 + lbHolders.length) % lbHolders.length;
  lbImg.src = lbHolders[lbCurrent].querySelector("img").src;
  lbUpdateProgress();
}
function lbNext() {
  lbCurrent = (lbCurrent + 1) % lbHolders.length;
  lbImg.src = lbHolders[lbCurrent].querySelector("img").src;
  lbUpdateProgress();
}

lbHolders.forEach((holder, i) => {
  holder.addEventListener("click", () => {
    if (activeLayout !== "layout-1-gall3ry") return;
    lbOpen(i);
  });
});
document.getElementById("lb-close").addEventListener("click", lbClose);
document.getElementById("lb-prev").addEventListener("click", lbPrev);
document.getElementById("lb-next").addEventListener("click", lbNext);
lbOverlay.addEventListener("click", (e) => { if (e.target === lbOverlay) lbClose(); });
document.addEventListener("keydown", (e) => {
  if (!lbOverlay.classList.contains("open")) return;
  if (e.key === "Escape") lbClose();
  if (e.key === "ArrowLeft") lbPrev();
  if (e.key === "ArrowRight") lbNext();
});
