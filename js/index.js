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


// ── Nav hover — swap background image ──
// Map each nav link href → background image to show on hover
const NAV_BG = {
  'forgetting-dreams.html': 'images/Forgettingdreams-1.jpg',
  'archive.html':           'images/sofia_archive-31.jpg',
  'about.html':             'images/Sybilbg.jpg',
};

// Hover image sits on top of the default bg
const hoverBg = new Image();
hoverBg.style.cssText = [
  'position:fixed',
  'inset:0',
  'width:100%',
  'height:100%',
  'object-fit:cover',
  'object-position:center',
  'opacity:0',
  'pointer-events:none',
  'z-index:1',
].join(';');
document.body.appendChild(hoverBg);

// Preload all hover images
Object.values(NAV_BG).forEach(src => { const i = new Image(); i.src = src; });

// ── Logo text swap on About hover ──
const logoEl       = document.querySelector('.logotext:not(.project)');
const LOGO_DEFAULT = 'Sofia Cartuccia';
const LOGO_SYBIL   = 'Sybil';

function swapLogoText(newText) {
  const spans = [...logoEl.querySelectorAll('.layout-nav-char')];
  spans.forEach((span, i) => {
    gsap.killTweensOf(span);
    gsap.to(span, {
      opacity: 0, y: -6,
      duration: 0.15,
      delay: i * 0.025,
      ease: 'power2.in',
      onComplete: i === spans.length - 1 ? () => {
        // Rebuild char spans with new text
        logoEl.innerHTML = '';
        [...newText].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'layout-nav-char post-font';
          s.textContent = ch === ' ' ? '\u00A0' : ch;
          logoEl.appendChild(s);
        });
        // Stagger new chars in from below
        [...logoEl.querySelectorAll('.layout-nav-char')].forEach((s, j) => {
          gsap.fromTo(s,
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.2, delay: j * 0.025, ease: 'power4.out' }
          );
        });
      } : undefined,
    });
  });
}

const aboutLink = document.querySelector('.main-nav .nav-link[href="about.html"]');
if (aboutLink) {
  aboutLink.addEventListener('mouseenter', () => swapLogoText(LOGO_SYBIL));
  aboutLink.addEventListener('mouseleave', () => swapLogoText(LOGO_DEFAULT));
}


let hoverTween = null;

document.querySelectorAll('.main-nav .nav-link').forEach(link => {
  const href = (link.getAttribute('href') || '').split('/').pop();
  const src  = NAV_BG[href];
  if (!src) return;

  link.addEventListener('mouseenter', () => {
    hoverBg.src = src;
    if (hoverTween) hoverTween.kill();
    hoverTween = gsap.to(hoverBg, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });
  });

  link.addEventListener('mouseleave', () => {
    if (hoverTween) hoverTween.kill();
    hoverTween = gsap.to(hoverBg, { opacity: 0, duration: 0.5, ease: 'power2.inOut' });
  });
});
