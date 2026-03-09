// ── Nav cursor follow + magnetic pull ──
const nav = document.querySelector('.main-nav');

// GSAP owns the transform — base centering via xPercent/yPercent
gsap.set(nav, { xPercent: -50, yPercent: 0 });

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
  'projects.html':          'images/Forgettingdreams-1.jpg',
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

const defaultBg  = document.querySelector('.imgbg');
const noiseLayers = [
  { el: document.querySelector('.dusti'),       peak: 0.7, rest: 0.1 },
  { el: document.querySelector('.nois3'),       peak: 0.5, rest: 0.1 },
  { el: document.querySelector('.nois3-grain'), peak: 0.6, rest: 0.08 },
].filter(l => l.el);

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
  gsap.to(bgLayers[next], { yPercent: 0, duration: 1.2, ease: 'power4.inOut' });
  if (out !== null) {
    gsap.to(bgLayers[out], { yPercent: -100, duration: 1.2, ease: 'power4.inOut' });
  } else if (defaultBg) {
    gsap.to(defaultBg, { yPercent: -100, duration: 1.2, ease: 'power4.inOut' });
  }
  bgFront = next;
  bgVisible = true;

  // Pulse noise/grain overlays during swap
  noiseLayers.forEach(({ el, peak, rest }) => {
    gsap.killTweensOf(el);
    gsap.to(el, { opacity: peak, duration: 0.6, ease: 'power4.in' });
    gsap.to(el, { opacity: rest, duration: 0.6, ease: 'power4.out', delay: 0.6 });
  });
}

const navHoverEls = [
  ...document.querySelectorAll('.main-nav .nav-link:not(.nav-dropdown-item)'),
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


// ── Logo text swap on hover (char stagger) ──
const logoEl = document.querySelector('.main-nav .logo-link');

if (logoEl) {
  const LOGO_DEFAULT = 'Sofia Cartuccia';
  const LOGO_SYBIL   = 'Sybil Sometimes';

  function swapLogoChars(newText) {
    const spans = logoEl.querySelectorAll('.layout-nav-char');
    const chars = [...newText].map(ch => ch === ' ' ? '\u00A0' : ch);
    spans.forEach((span, i) => {
      gsap.killTweensOf(span);
      gsap.to(span, {
        opacity: 0, y: -6, duration: 0.2, delay: i * 0.03, ease: 'power2.in',
        onComplete() {
          span.textContent = chars[i] ?? '';
          gsap.fromTo(span, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power4.out' });
        }
      });
    });
  }

  // "Sofia Cartuccia" is always low opacity — only "Sybil Sometimes" gets full opacity
  logoEl.classList.remove('active');
  logoEl.classList.add('notactive');

  // Restore "Sofia Cartuccia" at low opacity when another link becomes active
  logoEl._staggerOff = () => swapLogoChars(LOGO_DEFAULT);

  logoEl.addEventListener('mouseenter', () => swapLogoChars(LOGO_SYBIL));
}


// ── Projects dropdown ──
const dropdownWrap  = document.querySelector('.nav-dropdown-wrap');
const dropdown      = document.getElementById('projects-dropdown');
const dropdownItems = dropdown ? [...dropdown.querySelectorAll('.nav-dropdown-item')] : [];

if (dropdownWrap && dropdown) {
  const fullHeight = () => {
    dropdown.style.maxHeight = 'none';
    const h = dropdown.scrollHeight;
    dropdown.style.maxHeight = '0';
    return h;
  };

  dropdownWrap.addEventListener('mouseenter', () => {
    gsap.to(dropdown, { maxHeight: fullHeight(), duration: 0.25, ease: 'power2.out' });
    gsap.to(dropdownItems, { opacity: 1, duration: 0.2, stagger: 0.06, delay: 0.05, ease: 'power2.out' });
  });

  dropdownWrap.addEventListener('mouseleave', () => {
    gsap.to(dropdown, { maxHeight: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to(dropdownItems, { opacity: 0, duration: 0.15, ease: 'power2.in' });
  });
}
