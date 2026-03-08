// ── Name image overlay — tracks object-fit: cover position of bg image ──
// Tune these two values: fractions (0–1) of the ORIGINAL photo's dimensions
// where the top-left corner of the name image should appear.
const NAME_X = 0.34;  // ← left position within the photo (0 = left edge, 1 = right edge)
const NAME_Y = 0.67;  // ← top position within the photo (0 = top edge, 1 = bottom edge)
const NAME_W = 0.28;  // ← width of the name image as a fraction of the photo width

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
