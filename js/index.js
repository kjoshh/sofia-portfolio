
// ── Fluid Nav Bar Wobble ──
(function () {
  const indexNav = document.querySelector('.main-nav');
  if (!indexNav) return;
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
    curTime += 0.015;
    const s = curTime * 1.5;
    const r = (i) => Math.round(40 + (cnoise(s + i * 5.1, i * 4.2) - 0.5) * 16);
    navBg.style.borderRadius = `${r(0)}px ${r(1)}px ${r(2)}px ${r(3)}px / ${r(4)}px ${r(5)}px ${r(6)}px ${r(7)}px`;
    requestAnimationFrame(loop);
  })();
})();
