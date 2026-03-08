// ── Name image overlay — tracks object-fit: cover position of bg image ──
// Tune these two values: fractions (0–1) of the ORIGINAL photo's dimensions
// where the top-left corner of the name image should appear.
const NAME_X = 0.31;  // ← left position within the photo (0 = left edge, 1 = right edge)
const NAME_Y = 0.72;  // ← top position within the photo (0 = top edge, 1 = bottom edge)
const NAME_W = 0.37;  // ← width of the name image as a fraction of the photo width

const bg   = document.querySelector('.sofianamebg');
const name = document.querySelector('.sofianame');

function positionName() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const imgW = bg.naturalWidth;
  const imgH = bg.naturalHeight;
  if (!imgW || !imgH) return;

  // Replicate object-fit: cover; object-position: center
  const scale = Math.max(vw / imgW, vh / imgH);
  const renderedW = imgW * scale;
  const renderedH = imgH * scale;
  const offsetX = (vw - renderedW) / 2;
  const offsetY = (vh - renderedH) / 2;

  name.style.left  = (offsetX + NAME_X * renderedW) + 'px';
  name.style.top   = (offsetY + NAME_Y * renderedH) + 'px';
  name.style.width = (NAME_W * renderedW) + 'px';
}

bg.decode
  ? bg.decode().then(positionName)
  : bg.addEventListener('load', positionName);

window.addEventListener('resize', positionName);


// ── Cursor parallax ──
const PARALLAX_STRENGTH = 18; // px — how far the name drifts at screen edges

const moveX = gsap.quickTo(name, "x", { duration: 1, ease: "power2.out" });
const moveY = gsap.quickTo(name, "y", { duration: 1, ease: "power2.out" });

window.addEventListener('mousemove', (e) => {
  const dx = (e.clientX / window.innerWidth  - 0.5) * 2; // -1 to 1
  const dy = (e.clientY / window.innerHeight - 0.5) * 2;
  moveX(dx * PARALLAX_STRENGTH);
  moveY(dy * PARALLAX_STRENGTH);
});


// ── Analog paint trail ──
const TRAIL_LENGTH  = 15;   // ghost frames to keep
const TRAIL_OPACITY = 0.52; // max opacity of the oldest ghost
const TRAIL_JITTER  = 5;   // px of rough displacement on older frames

const trailCanvas = document.createElement('canvas');
trailCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;';
document.body.appendChild(trailCanvas);
const ctx = trailCanvas.getContext('2d');

function resizeTrailCanvas() {
  trailCanvas.width  = window.innerWidth;
  trailCanvas.height = window.innerHeight;
}
resizeTrailCanvas();
window.addEventListener('resize', resizeTrailCanvas);

let trail = [];
let prevX = null, prevY = null;

gsap.ticker.add(() => {
  const r = name.getBoundingClientRect();
  if (r.left === prevX && r.top === prevY) return;
  prevX = r.left;
  prevY = r.top;

  trail.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  if (trail.length > TRAIL_LENGTH) trail.shift();

  ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  trail.forEach((pos, i) => {
    const t    = (i + 1) / trail.length; // 0 = oldest, 1 = newest
    const age  = 1 - t;
    const jitter = age * TRAIL_JITTER;
    ctx.globalAlpha = t * TRAIL_OPACITY * (0.5 + Math.random() * 0.5);
    ctx.drawImage(
      name,
      pos.x + (Math.random() - 0.5) * jitter,
      pos.y + (Math.random() - 0.5) * jitter,
      pos.w, pos.h
    );
  });
});


// ── SVG liquid distortion filter ──
const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
svgEl.innerHTML = `<defs>
  <filter id="liq" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
    <feTurbulence id="liqT" type="fractalNoise" baseFrequency="0.018 0.011" numOctaves="4" seed="3" result="noise"/>
    <feDisplacementMap id="liqD" in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs>`;
document.body.appendChild(svgEl);

const liqT = document.getElementById('liqT');
const liqD = document.getElementById('liqD');

name.style.filter       = 'url(#liq)';
trailCanvas.style.filter = 'url(#liq)';

let velMag = 0, pmx = 0, pmy = 0;

gsap.ticker.add((time) => {
  const t = time * 0.18;
  liqT.setAttribute('baseFrequency',
    `${(0.018 + Math.sin(t) * 0.004).toFixed(4)} ${(0.011 + Math.cos(t * 1.3) * 0.003).toFixed(4)}`
  );
  const cur = parseFloat(liqD.getAttribute('scale')) || 10;
  liqD.setAttribute('scale', (cur + (10 + velMag * 30 - cur) * 0.07).toFixed(2));
  velMag *= 0.88;
});

window.addEventListener('mousemove', e => {
  velMag = Math.min(Math.hypot(e.clientX - pmx, e.clientY - pmy) / 30, 1);
  pmx = e.clientX;
  pmy = e.clientY;
});
