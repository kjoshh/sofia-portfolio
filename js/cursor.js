(function () {
  if (window.innerWidth <= 767 || 'ontouchstart' in window) return;

  const cursor = document.getElementById("cursor");
  if (!cursor) return;

  let mouseX = 0, mouseY = 0, curX = 0, curY = 0, curTime = 0;
  let cursorRaf = null, mouseMoving = false, mouseIdleTimer = null;

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

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    mouseMoving = true;
    clearTimeout(mouseIdleTimer);
    mouseIdleTimer = setTimeout(() => { mouseMoving = false; }, 150);
    if (!cursorRaf) cursorRaf = requestAnimationFrame(loop);
  });

  document.querySelectorAll("a, button, [role='button']").forEach(el => {
    el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
  });

  function loop() {
    curX += (mouseX - curX) * 0.13;
    curY += (mouseY - curY) * 0.13;
    curTime += 0.02;
    const wx = (cnoise(curTime * 1.1, 0) - 0.5) * 2;
    const wy = (cnoise(0, curTime * 1.1 + 50) - 0.5) * 2;
    cursor.style.left = (curX + wx) + "px";
    cursor.style.top  = (curY + wy) + "px";
    const s = curTime * 2.75;
    const r = (i) => Math.round(30 + cnoise(s + i * 7.3, i * 4.1) * 34);
    cursor.style.borderRadius = `${r(0)}% ${r(1)}% ${r(2)}% ${r(3)}% / ${r(4)}% ${r(5)}% ${r(6)}% ${r(7)}%`;

    const dx = mouseX - curX, dy = mouseY - curY;
    if (!mouseMoving && dx * dx + dy * dy < 0.25) {
      cursorRaf = null;
      return;
    }
    cursorRaf = requestAnimationFrame(loop);
  }
})();
