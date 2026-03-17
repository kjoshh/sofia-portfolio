/* ══════════════════════════════════════════
   Landing — Per-Letter Proximity Morph
   ══════════════════════════════════════════ */

(function () {
  const SOFIA = 'Sofia Cartuccia';
  const SYBIL = 'Sybil Sometimes';
  const container = document.getElementById('landingName');
  if (!container) return;

  const PROXIMITY_RADIUS = 32;
  const LINGER_DELAY = 750;
  const MORPH_DURATION = 0.4;
  const SPRING_OUT = 'elastic.out(1, 0.75)';
  const SPRING_SOFT = 'back.out(1.7)';

  // ── Build letter tiles ──
  const tiles = [];

  for (let i = 0; i < SOFIA.length; i++) {
    const sofiaChar = SOFIA[i];
    const sybilChar = SYBIL[i];
    const isSpace = sofiaChar === ' ';
    const isSame = sofiaChar.toLowerCase() === sybilChar.toLowerCase();

    const tile = document.createElement('span');
    tile.className = 'letter-tile' + (isSpace ? ' is-space' : '') + (isSame ? ' is-same' : '');
    tile.dataset.index = i;

    const front = document.createElement('span');
    front.className = 'letter-front';
    front.textContent = isSpace ? '\u00A0' : sofiaChar;

    const back = document.createElement('span');
    back.className = 'letter-back';
    back.textContent = isSpace ? '\u00A0' : sybilChar;

    // Make the "S" of "Sometimes" match the capital "C" height
    if (sybilChar === 'S' && sofiaChar === 'C') {
      back.style.fontSize = '1.15em';
    }

    tile.appendChild(front);
    tile.appendChild(back);
    container.appendChild(tile);

    tiles.push({
      el: tile, front, back,
      index: i, isSpace, isSame,
      sybil: false, lingerTimer: null,
    });
  }

  // ═══════════════════════════════════════
  // MORPH LOGIC
  // ═══════════════════════════════════════

  function sybilCount() {
    return tiles.filter((t) => t.sybil && !t.isSpace).length;
  }
  const totalLetters = tiles.filter((t) => !t.isSpace).length;

  function updateBackground() {
    const ratio = sybilCount() / totalLetters;
    document.body.classList.toggle('flipped', ratio > 0.4);
  }

  function morphToSybil(t) {
    if (t.isSpace || t.sybil || t.isSame) return;
    if (t.lingerTimer) { clearTimeout(t.lingerTimer); t.lingerTimer = null; }
    t.sybil = true;
    gsap.to(t.front, { opacity: 0, scale: 0.5, filter: 'blur(4px)', duration: MORPH_DURATION * 0.6, ease: 'power2.in', overwrite: true });
    const sybilCh = SYBIL[t.index];
    const isM = sybilCh?.toLowerCase() === 'm';
    const isBigS = sybilCh === 'S' && SOFIA[t.index] === 'C';
    const xOff = isM ? '-0.08em' : isBigS ? '0.1em' : 0;     
          const yOff = isBigS ? '-0.05em' : '0.1em';
    gsap.to(t.back, { opacity: 1, scale: 1, x: xOff, y: yOff, filter: 'blur(0px)', duration: MORPH_DURATION, ease: SPRING_OUT, overwrite: true });
    updateBackground();
  }

  function morphToSofia(t) {
    if (t.isSpace || !t.sybil) return;
    t.sybil = false;
    gsap.to(t.back, { opacity: 0, scale: 0.5, filter: 'blur(4px)', duration: MORPH_DURATION * 0.6, ease: 'power2.in', overwrite: true });
    gsap.to(t.front, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: MORPH_DURATION, ease: SPRING_OUT, overwrite: true });
    updateBackground();
  }

  function morphToSofiaDelayed(t) {
    if (t.isSpace || !t.sybil) return;
    if (t.lingerTimer) clearTimeout(t.lingerTimer);
    t.lingerTimer = setTimeout(() => { t.lingerTimer = null; morphToSofia(t); }, LINGER_DELAY);
  }

  // ═══════════════════════════════════════
  // PROXIMITY DETECTION
  // ═══════════════════════════════════════

  let mouseX = -9999, mouseY = -9999;
  let proximityRaf = null;
  let cursorOverName = false;

  function checkProximity() {
    tiles.forEach((t) => {
      if (t.isSpace) return;
      const rect = t.el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX - cx, mouseY - cy);
      if (dist < PROXIMITY_RADIUS) {
        morphToSybil(t);
      } else if (t.sybil && !t.lingerTimer) {
        morphToSofiaDelayed(t);
      }
    });
    proximityRaf = null;
  }

  // Per-letter parallax — letters push away from cursor
  const LETTER_PARALLAX = 5;

  function updateLetterParallax() {
    tiles.forEach((t) => {
      if (t.isSpace) return;
      const rect = t.el.getBoundingClientRect();
      const lx = rect.left + rect.width / 2;
      const ly = rect.top + rect.height / 2;
      const dx = lx - mouseX;
      const dy = ly - mouseY;
      const dist = Math.hypot(dx, dy);
      const maxDist = 400;

      if (dist < maxDist) {
        const strength = (1 - dist / maxDist) * LETTER_PARALLAX;
        const nx = (dx / (dist || 1)) * strength;
        const ny = (dy / (dist || 1)) * strength;
        gsap.to(t.el, { x: nx, y: ny, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      } else {
        gsap.to(t.el, { x: 0, y: 0, duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
      }
    });
  }

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    updateParallax(e.clientX, e.clientY);
    updateLetterParallax();
    if (!proximityRaf) proximityRaf = requestAnimationFrame(checkProximity);
  }

  container.addEventListener('mouseenter', () => {
    cursorOverName = true;
    clearAutoBreath();
  });

  container.addEventListener('mouseleave', (e) => {
    cursorOverName = false;
    const exitX = e.clientX, exitY = e.clientY;
    tiles.forEach((t) => {
      if (!t.sybil || t.isSpace) return;
      const rect = t.el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(exitX - cx, exitY - cy);
      const stagger = Math.min(dist * 4, 600);
      if (t.lingerTimer) clearTimeout(t.lingerTimer);
      t.lingerTimer = setTimeout(() => { t.lingerTimer = null; morphToSofia(t); }, LINGER_DELAY + stagger);
    });
    resetAutoBreathTimer();
  });

  document.addEventListener('mousemove', onMouseMove);

  // Mobile: tap to toggle
  tiles.forEach((t) => {
    if (t.isSpace) return;
    t.el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      clearAutoBreath();
      t.sybil ? morphToSofia(t) : morphToSybil(t);
      resetAutoBreathTimer();
    }, { passive: false });
  });

  // ═══════════════════════════════════════
  // STAGGERED ENTRANCE
  // ═══════════════════════════════════════

  gsap.set(container, { opacity: 1 });
  tiles.forEach((t) => {
    if (t.isSpace) return;
    gsap.set(t.front, { opacity: 0, y: 20, filter: 'blur(6px)' });
  });

  const entranceTl = gsap.timeline({ delay: 0.4 });
  tiles.forEach((t, i) => {
    if (t.isSpace) return;
    entranceTl.to(t.front, {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: 0.7, ease: SPRING_SOFT,
    }, i * 0.06);
  });

  // ═══════════════════════════════════════
  // PARALLAX DEPTH
  // ═══════════════════════════════════════

  const grainEl = document.querySelector('.grain');
  const dustiEl = document.querySelector('.dusti');

  function updateParallax(mx, my) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (mx - cx) / cx;
    const dy = (my - cy) / cy;
    if (grainEl) grainEl.style.transform = `translate(${-dx * 8}px, ${-dy * 6}px)`;
    if (dustiEl) dustiEl.style.transform = `translate(${-dx * 12}px, ${-dy * 10}px)`;
  }

  // ═══════════════════════════════════════
  // AUTO-BREATH
  // ═══════════════════════════════════════

  let autoBreathInterval = null;
  let autoBreathTimeout = null;
  let breathIndex = 0;

  function doBreathStep() {
    if (cursorOverName) return;
    const nonSpace = tiles.filter((t) => !t.isSpace);
    if (breathIndex >= nonSpace.length) breathIndex = 0;
    const t = nonSpace[breathIndex];
    morphToSybil(t);
    setTimeout(() => morphToSofia(t), LINGER_DELAY + 400);
    breathIndex++;
  }

  function startAutoBreath() {
    clearAutoBreath();
    breathIndex = 0;
    autoBreathInterval = setInterval(doBreathStep, 350);
  }

  function clearAutoBreath() {
    if (autoBreathInterval) clearInterval(autoBreathInterval);
    if (autoBreathTimeout) clearTimeout(autoBreathTimeout);
    autoBreathInterval = null;
    autoBreathTimeout = null;
  }

  function resetAutoBreathTimer() {
    if (autoBreathTimeout) clearTimeout(autoBreathTimeout);
    autoBreathTimeout = setTimeout(startAutoBreath, 8000);
  }

  autoBreathTimeout = setTimeout(startAutoBreath, 5000);

})();
