// ── Name image overlay — tracks object-fit: cover position of bg image ──
const NAME_X = 0.31;
const NAME_Y = 0.72;
const NAME_W = 0.37;

const bg   = document.querySelector('.sofianamebg');
const name = document.querySelector('.sofianame');

// Hide the original bg img — the erase canvas replicates it
bg.style.display = 'none';

// ── Sybil layer (revealed by erasing) ──
const sybilBg = new Image();
sybilBg.src = 'images/Sybilbg.jpg';
sybilBg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:5;pointer-events:none;';
document.body.appendChild(sybilBg);

const sybilName = new Image();
sybilName.src = 'images/sybilsmtimg.png';
sybilName.style.cssText = 'position:fixed;object-fit:contain;object-position:left top;display:block;z-index:6;pointer-events:none;';
document.body.appendChild(sybilName);

// ── Erase canvas (Sofia bg drawn here — destination-out reveals Sybil below) ──
const eraseCanvas = document.createElement('canvas');
eraseCanvas.style.cssText = 'position:fixed;inset:0;z-index:10;pointer-events:none;';
document.body.appendChild(eraseCanvas);
const ectx = eraseCanvas.getContext('2d');

// Sofia name floats above the erase canvas
name.style.zIndex = '13';

// ── Position ──
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

  const left  = (offsetX + NAME_X * renderedW) + 'px';
  const top   = (offsetY + NAME_Y * renderedH) + 'px';
  const width = (NAME_W * renderedW) + 'px';

  name.style.left  = left;
  name.style.top   = top;
  name.style.width = width;

  sybilName.style.left  = left;
  sybilName.style.top   = top;
  sybilName.style.width = width;
}

function drawSofiaBg(alpha) {
  if (!bg.naturalWidth) return;
  const cw = eraseCanvas.width;
  const ch = eraseCanvas.height;
  const scale = Math.max(cw / bg.naturalWidth, ch / bg.naturalHeight);
  const dw    = bg.naturalWidth  * scale;
  const dh    = bg.naturalHeight * scale;
  const dx    = (cw - dw) / 2;
  const dy    = (ch - dh) / 2;
  ectx.globalCompositeOperation = 'source-over';
  ectx.globalAlpha = alpha;
  ectx.drawImage(bg, dx, dy, dw, dh);
  ectx.globalAlpha = 1;
}

function initCanvas() {
  eraseCanvas.width  = window.innerWidth;
  eraseCanvas.height = window.innerHeight;
  drawSofiaBg(1);
  positionName();
}

bg.decode
  ? bg.decode().then(initCanvas)
  : bg.addEventListener('load', initCanvas);

window.addEventListener('resize', initCanvas);


// ── Cursor parallax ──
const PARALLAX_STRENGTH = 18;

const moveX  = gsap.quickTo(name,      'x', { duration: 1, ease: 'power2.out' });
const moveY  = gsap.quickTo(name,      'y', { duration: 1, ease: 'power2.out' });
const moveSX = gsap.quickTo(sybilName, 'x', { duration: 1, ease: 'power2.out' });
const moveSY = gsap.quickTo(sybilName, 'y', { duration: 1, ease: 'power2.out' });

window.addEventListener('mousemove', (e) => {
  const dx = (e.clientX / window.innerWidth  - 0.5) * 2;
  const dy = (e.clientY / window.innerHeight - 0.5) * 2;
  moveX(dx * PARALLAX_STRENGTH);
  moveY(dy * PARALLAX_STRENGTH);
  moveSX(dx * PARALLAX_STRENGTH);
  moveSY(dy * PARALLAX_STRENGTH);
});


// ── Eraser (mousedown + drag) ──
let isDrawing = false;
let lastX = 0, lastY = 0;

const BRUSH_R = 40; // outer radius of soft brush

function eraseDot(x, y) {
  const g = ectx.createRadialGradient(x, y, 0, x, y, BRUSH_R);
  g.addColorStop(0,   'rgba(0,0,0,0.18)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.08)');
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ectx.globalCompositeOperation = 'destination-out';
  ectx.fillStyle = g;
  ectx.beginPath();
  ectx.arc(x, y, BRUSH_R, 0, Math.PI * 2);
  ectx.fill();
}

function erase(e) {
  if (!isDrawing) return;
  // Stamp dots along the segment for smooth coverage
  const dist  = Math.hypot(e.clientX - lastX, e.clientY - lastY);
  const steps = Math.max(Math.ceil(dist / 6), 1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    eraseDot(lastX + (e.clientX - lastX) * t, lastY + (e.clientY - lastY) * t);
  }
  lastX = e.clientX;
  lastY = e.clientY;
}

window.addEventListener('mousedown', (e) => {
  isDrawing = true;
  lastX = e.clientX;
  lastY = e.clientY;
  stopRestore();
});

window.addEventListener('mousemove', erase);

window.addEventListener('mouseup', () => {
  if (!isDrawing) return;
  isDrawing = false;
  startRestore();
});


// ── Restore after mouseup ──
let restoreRaf    = null;
let restoreFrames = 0;

function stopRestore() {
  if (restoreRaf) {
    cancelAnimationFrame(restoreRaf);
    restoreRaf = null;
  }
  restoreFrames = 0;
}

function startRestore() {
  stopRestore();
  doRestore();
}

function doRestore() {
  restoreFrames++;
  if (restoreFrames > 90) {
    eraseCanvas.width  = window.innerWidth;
    eraseCanvas.height = window.innerHeight;
    drawSofiaBg(1);
    restoreFrames = 0;
    return;
  }
  drawSofiaBg(0.05);
  restoreRaf = requestAnimationFrame(doRestore);
}
