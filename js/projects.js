/* ── Project list mouse parallax ── */
const projList = document.getElementById('proj-list');
const STRENGTH = 18;

const moveX = gsap.quickTo(projList, 'x', { duration: 1.1, ease: 'power3.out' });
const moveY = gsap.quickTo(projList, 'y', { duration: 1.1, ease: 'power3.out' });

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  const cx = innerWidth  / 2;
  const cy = innerHeight / 2;
  moveX((e.clientX - cx) / cx * STRENGTH);
  moveY((e.clientY - cy) / cy * STRENGTH);
});


/* ── Hover image reveal ── */
let topZ = 2;
const projItems = [...document.querySelectorAll('.proj-item')];

projItems.forEach(item => {
  const wrap = item.querySelector('.proj-img-wrap');

  // Move to body so position:fixed is relative to viewport, not the transformed .proj-list
  document.body.appendChild(wrap);

  let enterTween = null;
  let leaveTween = null;

  item.addEventListener('mouseenter', () => {
    gsap.set(wrap, {
      x: mouseX - wrap.offsetWidth  / 2,
      y: mouseY - wrap.offsetHeight / 2,
      zIndex: ++topZ,
    });
    if (leaveTween) leaveTween.kill();
    enterTween = gsap.to(wrap, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
    gsap.to(projItems.filter(el => el !== item), { opacity: 0.5, duration: 0.3, ease: 'power2.out' });
  });

  item.addEventListener('mouseleave', () => {
    if (enterTween) enterTween.kill();
    leaveTween = gsap.to(wrap, { opacity: 0, scale: 0.88, duration: 0.4, ease: 'power2.in' });
    gsap.to(projItems, { opacity: 1, duration: 0.3, ease: 'power2.out' });
  });

  item.addEventListener('mousemove', e => {

    gsap.to(wrap, {
      x: e.clientX - wrap.offsetWidth  / 2,
      y: e.clientY - wrap.offsetHeight / 2,
      duration: 0.55,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  });
});
