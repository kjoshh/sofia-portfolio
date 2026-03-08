// ── Nav cursor follow + magnetic pull ──
const nav = document.querySelector('.main-nav');

// GSAP owns the transform — base centering via xPercent/yPercent
gsap.set(nav, { xPercent: -50, yPercent: -50 });

const navMoveX = gsap.quickTo(nav, 'x', { duration: 0.9, ease: 'power3.out' });
const navMoveY = gsap.quickTo(nav, 'y', { duration: 0.9, ease: 'power3.out' });

const PARALLAX_STRENGTH = 12.5;

window.addEventListener('mousemove', e => {
  const cx = innerWidth  / 2;
  const cy = innerHeight / 2;
  navMoveX((e.clientX - cx) / cx * PARALLAX_STRENGTH);
  navMoveY((e.clientY - cy) / cy * PARALLAX_STRENGTH);
});


// ── Nav hover — swap background image (slide in from bottom) ──
const NAV_BG = {
  'index.html':             'images/0017_17A.jpg',
  'forgetting-dreams.html': 'images/Forgettingdreams-1.jpg',
  'archive.html':           'images/sofia_archive-31.jpg',
  'about.html':             'images/Sybilbg.jpg',
};

// Overflow-hidden wrapper clips the sliding images
const bgWrap = document.createElement('div');
bgWrap.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:1;';
document.body.appendChild(bgWrap);

function makeBgLayer() {
  const img = document.createElement('img');
  img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;';
  bgWrap.appendChild(img);
  gsap.set(img, { yPercent: 100 });
  return img;
}

const bgLayers = [makeBgLayer(), makeBgLayer()];
let bgFront = 0;
let bgVisible = false;
let bgCurrentSrc = null;

const defaultBg = document.querySelector('.imgbg');

// Preload all hover images
Object.values(NAV_BG).forEach(src => { const i = new Image(); i.src = src; });


function slideBg(src) {
  if (src === bgCurrentSrc) return;
  bgCurrentSrc = src;
  const next = bgVisible ? 1 - bgFront : 0;
  const out  = bgVisible ? bgFront : null;
  bgLayers[next].src = src;
  gsap.killTweensOf(bgLayers);
  gsap.set(bgLayers[next], { yPercent: 100 });
  gsap.to(bgLayers[next], { yPercent: 0, duration: 0.9, ease: 'power3.inOut' });
  if (out !== null) {
    gsap.to(bgLayers[out], { yPercent: -100, duration: 0.9, ease: 'power3.inOut' });
  } else if (defaultBg) {
    gsap.to(defaultBg, { yPercent: -100, duration: 0.9, ease: 'power3.inOut' });
  }
  bgFront = next;
  bgVisible = true;
}

const navHoverEls = [
  ...document.querySelectorAll('.main-nav .nav-link'),
  document.querySelector('.main-nav .logotext:not(.project)'),
].filter(Boolean);

function setNavActive(activeEl) {
  navHoverEls.forEach(el => {
    if (el === activeEl) {
      el.classList.add('active');
      el.classList.remove('notactive');
    } else {
      const wasActive = el.classList.contains('active');
      el.classList.remove('active');
      el.classList.add('notactive');
      if (wasActive && el._staggerOff) el._staggerOff();
    }
  });
}

navHoverEls.forEach(el => {
  const href = (el.getAttribute('href') || '').split('/').pop() || 'index.html';
  const src  = NAV_BG[href];
  if (!src) return;
  el.addEventListener('mouseenter', () => {
    slideBg(src);
    setNavActive(el);
  });
});
