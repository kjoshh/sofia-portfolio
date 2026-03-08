// ── Name image overlay — tracks object-fit: cover position of bg image ──
const NAME_X = 0.31;
const NAME_Y = 0.72;
const NAME_W = 0.37;

const bg   = document.querySelector('.sofianamebg');
const name = document.querySelector('.sofianame');

function positionName() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const imgW = bg.naturalWidth;
  const imgH = bg.naturalHeight;
  if (!imgW || !imgH) return;

  const scale    = Math.max(vw / imgW, vh / imgH);
  const renderedW = imgW * scale;
  const renderedH = imgH * scale;
  const offsetX   = (vw - renderedW) / 2;
  const offsetY   = (vh - renderedH) / 2;

  name.style.left  = (offsetX + NAME_X * renderedW) + 'px';
  name.style.top   = (offsetY + NAME_Y * renderedH) + 'px';
  name.style.width = (NAME_W * renderedW) + 'px';
}

bg.decode
  ? bg.decode().then(positionName)
  : bg.addEventListener('load', positionName);

window.addEventListener('resize', positionName);


// ── Cursor parallax ──
const PARALLAX_STRENGTH = 18;

const moveX = gsap.quickTo(name, 'x', { duration: 1, ease: 'power2.out' });
const moveY = gsap.quickTo(name, 'y', { duration: 1, ease: 'power2.out' });

window.addEventListener('mousemove', (e) => {
  const dx = (e.clientX / window.innerWidth  - 0.5) * 2;
  const dy = (e.clientY / window.innerHeight - 0.5) * 2;
  moveX(dx * PARALLAX_STRENGTH);
  moveY(dy * PARALLAX_STRENGTH);
});


// ── Nav hover — swap background image ──
// Map each nav link href → background image to show on hover
const NAV_BG = {
  'forgetting-dreams.html': 'images/Forgettingdreams-1.jpg',
  'archive.html':           'images/sofia_archive-1.jpg',
  'about.html':             'images/0017_17A.jpg',
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
