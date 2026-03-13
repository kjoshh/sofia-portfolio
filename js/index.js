
// ── Nav hover — GSAP slide background transition ──
const BG_SOFIA = 'images/0017_17A.jpg';
const BG_SYBIL = 'images/Sybilbg.jpg';

const defaultBg = document.querySelector('.imgbg');

const noiseLayers = [
  { el: document.querySelector('.dusti'),       peak: 0.7, rest: 0.1  },
  { el: document.querySelector('.nois3'),       peak: 0.5, rest: 0.1  },
  { el: document.querySelector('.nois3-grain'), peak: 0.6, rest: 0.08 },
].filter(l => l.el);

// Overflow-hidden wrapper clips the sliding layers
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
let bgFront = 0, bgVisible = false, bgCurrentSrc = null;

// Preload logo toggle images
[BG_SOFIA, BG_SYBIL].forEach(src => { const i = new Image(); i.src = src; });

function slideBg(src) {
  if (src === bgCurrentSrc) return;
  bgCurrentSrc = src;

  const next = bgVisible ? 1 - bgFront : 0;
  const out  = bgVisible ? bgFront : null;

  bgLayers[next].src = src;
  gsap.killTweensOf(bgLayers);
  gsap.set(bgLayers[next], { yPercent: 100 });
  gsap.to(bgLayers[next], { yPercent: 0,    duration: 0.9, ease: 'power3.inOut' });

  if (out !== null) {
    gsap.to(bgLayers[out], { yPercent: -100, duration: 0.9, ease: 'power3.inOut' });
  } else if (defaultBg) {
    gsap.to(defaultBg,     { yPercent: -100, duration: 0.9, ease: 'power3.inOut' });
  }

  bgFront = next;
  bgVisible = true;

  // Pulse noise layers on transition
  noiseLayers.forEach(({ el, peak, rest }) => {
    gsap.killTweensOf(el);
    gsap.to(el, { opacity: peak, duration: 0.6, ease: 'power4.in' });
    gsap.to(el, { opacity: rest, duration: 0.6, ease: 'power4.out', delay: 0.6 });
  });
}

// ── Logo toggle (sticky flip on each mouseenter) ──
const logoEl = document.querySelector('.main-nav .logo-link');

if (logoEl) {
  const sybilChars = [...'Sybil Sometimes'].map(ch => ch === ' ' ? '\u00A0' : ch);
  let sybilMode = false;

  function swapLogoChars(toSybil) {
    logoEl.querySelectorAll('.char-wrapper').forEach((wrapper, i) => {
      const top = wrapper.querySelector('.char-top');
      const bot = wrapper.querySelector('.char-bottom');
      gsap.killTweensOf([top, bot]);

      if (toSybil) {
        // Sofia exits top, Sybil enters from below
        bot.textContent = sybilChars[i] ?? '';
        gsap.set(bot, { yPercent: 0 });
        gsap.to([top, bot], { yPercent: -100, duration: 0.4, delay: i * 0.03, ease: 'power3.inOut' });
      } else {
        // Sybil exits top, Sofia enters from below
        gsap.set(top, { yPercent: 100 });
        gsap.to(bot, { yPercent: -200, duration: 0.4, delay: i * 0.03, ease: 'power3.inOut' });
        gsap.to(top, { yPercent: 0,    duration: 0.4, delay: i * 0.03, ease: 'power3.inOut' });
      }
    });
  }

  logoEl.addEventListener('mouseenter', () => {
    sybilMode = !sybilMode;
    swapLogoChars(sybilMode);
    slideBg(sybilMode ? BG_SYBIL : BG_SOFIA);
  });
}


// ── Project Dropdown ──
const dropdownWrap = document.querySelector('.nav-dropdown-wrap');
const dropdown = document.getElementById('projects-dropdown');
const dropdownItems = dropdown ? [...dropdown.querySelectorAll('.nav-dropdown-item')] : [];

if (dropdownWrap && dropdown) {
  // Align dropdown items with the Projects link
  function alignDropdown() {
    const projectsRect = dropdownWrap.getBoundingClientRect();
    const wrapinRect = dropdownWrap.closest('.wrapin').getBoundingClientRect();
    dropdown.style.paddingLeft = (projectsRect.left - wrapinRect.left) + 'px';
  }
  alignDropdown();
  window.addEventListener('resize', alignDropdown);

  const fullHeight = () => {
    const currentMaxHeight = dropdown.style.maxHeight;
    dropdown.style.maxHeight = 'none';
    const h = dropdown.scrollHeight;
    dropdown.style.maxHeight = currentMaxHeight;
    return h;
  };

  dropdownWrap.addEventListener('mouseenter', () => {
    gsap.to(dropdown, { maxHeight: fullHeight(), duration: 0.25, ease: 'power2.out' });
    gsap.to(dropdownItems, { opacity: 1, duration: 0.2, stagger: 0.06, delay: 0.05, ease: 'power2.out' });
  });

  const closeDropdown = () => {
    gsap.to(dropdown, { maxHeight: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to(dropdownItems, { opacity: 0, duration: 0.15, ease: 'power2.in' });
  };

  // Close when mouse leaves the whole nav pill
  const mainNavWrapper = document.querySelector('.main-nav');
  if (mainNavWrapper) mainNavWrapper.addEventListener('mouseleave', closeDropdown);

  // Close when hovering other main links
  document.querySelectorAll('.main-nav .nav-link:not(.nav-dropdown-item)').forEach(link => {
    if (!link.closest('.nav-dropdown-wrap')) {
      link.addEventListener('mouseenter', closeDropdown);
    }
  });
}

// ── Fluid Nav Bar Wobble ──
(function () {
  const indexNav = document.querySelector('.main-nav');
  const navBg = indexNav.querySelector('.nav-bg') || indexNav;

  let curTime = 0;
  function cfract(x) { return x - Math.floor(x); }
  function chash(px, py) { return cfract(Math.sin(px * 127.1 + py * 311.7) * 43758.5453); }
  function cnoise(px, py) {
    const ix = Math.floor(px), iy = Math.floor(py);
    const fx = px - ix, fy = py - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return chash(ix, iy) + (chash(ix + 1, iy) - chash(ix, iy)) * ux
      + (chash(ix, iy + 1) - chash(ix, iy)) * uy
      + (chash(ix, iy) - chash(ix + 1, iy) - chash(ix, iy + 1) + chash(ix + 1, iy + 1)) * ux * uy;
  }

  (function loop() {
    curTime += 0.015; // Animation speed
    const s = curTime * 1.5;

    // The base border-radius is ~40px (updated from 20px). 
    // We add noise to each corner to organically squash and stretch it.
    const r = (i) => Math.round(40 + (cnoise(s + i * 5.1, i * 4.2) - 0.5) * 16);

    navBg.style.borderRadius = `${r(0)}px ${r(1)}px ${r(2)}px ${r(3)}px / ${r(4)}px ${r(5)}px ${r(6)}px ${r(7)}px`;
    requestAnimationFrame(loop);
  })();
})();
