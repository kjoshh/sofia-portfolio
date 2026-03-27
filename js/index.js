/* ── Refs ── */

const letterField = document.getElementById('letterField');
const frameWrap = document.getElementById('frameWrap');
const sceneEl = document.getElementById('scene');

/* ── Mobile detection ── */
const isMobile = () => window.matchMedia('(max-width: 991px)').matches;

/* ── State ── */
let currentName = 'sofia';
let revealComplete = false;
let revealStarted = false;

function markRevealComplete() {
  revealComplete = true;
  frameWrap.style.cursor = '';
}



/* ── Hover triggers ── */
const bgHoverEl = document.getElementById('bgHover');
const frameBorderEl = document.getElementById('frameBorderHover');
const outerBorder = frameWrap.querySelector('.frame-border');
const framePhotoEl = document.getElementById('bg');

/* ── Hover ── */
let firstHoverDone = false;
const bgSybilEl = document.getElementById('bgSybil');

function hoverIn() {
  if (!revealComplete) return;
  if (!firstHoverDone) {
    firstHoverDone = true;

    // Bg wipe in
    gsap.to(bgHoverEl, { clipPath: 'inset(0 0% 0 0)', duration: 0.75, ease: 'power3.inOut', overwrite: true });

    // Sybil photo fade in
    gsap.to(bgSybilEl, { opacity: 1, duration: 0.4, delay: 0.35, ease: 'power4.in', x:20, overwrite: true });

    // Border fade + slide in (same as sybil photo)
    gsap.to(frameBorderEl, { opacity: 1, x: 20, duration: 0.4, delay: 0.35, ease: 'power4.in', overwrite: true });
  }

  // Letters swap every hover
  swapTo(currentName === 'sofia' ? 'sybil' : 'sofia');

  // Soft breathe — scale whole scene
  gsap.to(sceneEl, { scale: 1.0075, duration: 0.7, ease: 'power2.out', overwrite: true });
}

function hoverOut() {
  if (!revealComplete) return;
  gsap.to(sceneEl, { scale: 1, duration: 0.7, ease: 'power2.inOut', overwrite: true });
}

/* ── Viewport-aware listener binding ── */
let hoverBound = false;
let tapBound = false;
let lastTapTime = 0;

function handleTap(e) {
  if (!revealComplete) return;
  if (e.target.closest('.mob-sheet')) return;
  const now = Date.now();
  if (e.type === 'click' && now - lastTapTime < 500) return;
  if (e.type === 'touchend') lastTapTime = now;
  swapTo(currentName === 'sofia' ? 'sybil' : 'sofia');
}

function bindListeners() {
  const mobile = isMobile();

  if (!mobile && !hoverBound) {
    frameWrap.addEventListener('mouseenter', hoverIn);
    frameWrap.addEventListener('mouseleave', hoverOut);
    hoverBound = true;
  } else if (mobile && hoverBound) {
    frameWrap.removeEventListener('mouseenter', hoverIn);
    frameWrap.removeEventListener('mouseleave', hoverOut);
    hoverBound = false;
  }

  if (mobile && !tapBound) {
    document.addEventListener('touchend', handleTap);
    document.addEventListener('click', handleTap);
    tapBound = true;
  } else if (!mobile && tapBound) {
    document.removeEventListener('touchend', handleTap);
    document.removeEventListener('click', handleTap);
    tapBound = false;
  }
}

bindListeners();

frameWrap.addEventListener('click', () => {
  if (!revealComplete) return;
  hoverIn();
});

/* ── Slot-based letter swap with physics ── */
const sofiaChars = 'sofia cartuccia'.split('');
const sybilChars = 'sybil sometimes'.split('');

let _metricsCache = null;
function _computeMetrics() {
  const fw = frameWrap.getBoundingClientRect().width;
  if (isMobile()) {
    return {
      letterH: fw * 0.065,
      letterW: fw * 0.052,
      spaceW:  fw * 0.048,
      swapDist: fw * 0.075,
      offsetX: fw * 0.06,
      offsetY: fw * 0.04,
    };
  }
  return {
    letterH: fw * 0.03225,
    letterW: fw * 0.042,
    spaceW:  fw * 0.0525,
    swapDist: fw * 0.05,
    offsetX: fw * 0.02,
    offsetY: fw * 0.0225,
  };
}
function getLetterMetrics() {
  if (!_metricsCache) _metricsCache = _computeMetrics();
  return _metricsCache;
}
function invalidateMetrics() { _metricsCache = null; }
window.addEventListener('resize', invalidateMetrics);

const slots = [];

for (let i = 0; i < sofiaChars.length; i++) {
  if (sofiaChars[i] === ' ') continue;

  const sc = sofiaChars[i];
  const yc = sybilChars[i];

  const sofiaEl = document.createElement('img');
  sofiaEl.className = 'letter-el';
  sofiaEl.src = `https://cdn.jsdelivr.net/gh/kjoshh/sofia-portfolio@main/images-neu/${sc}.png`;
  sofiaEl.alt = sc;
  letterField.appendChild(sofiaEl);

  const sybilEl = document.createElement('img');
  sybilEl.className = 'letter-el';
  sybilEl.src = `https://cdn.jsdelivr.net/gh/kjoshh/sofia-portfolio@main/images-neu/${yc}.png`;
  sybilEl.alt = yc;
  letterField.appendChild(sybilEl);

  slots.push({
    nameIndex: i,
    sofiaEl,
    sybilEl,
    restRot: (Math.random() - 0.5) * 3,
    x: 0,
    y: 0,
  });
}

/* ── Position calculations ── */
function calcPositions() {
  const m = getLetterMetrics();
  const rect = frameWrap.getBoundingClientRect();
  // Letters above the frame — single line (same logic for mobile and desktop)
  const anchorY = rect.top + 10;
  const anchorX = rect.left + rect.width / 2;
  const totalW = 14 * m.letterW + m.spaceW;
  const startX = anchorX - totalW / 2;

  const kernAfterSybil = { m: isMobile() ? 0.5 : 0.3 };
  const kernAfterSofia = { u: isMobile() ? 0.45 : 0.3 };
  let kern = 0;

  for (const slot of slots) {
    const i = slot.nameIndex;
    if (i < 5) {
      slot.x = startX + i * m.letterW + m.letterW / 2;
    } else {
      slot.x = startX + 5 * m.letterW + m.spaceW + (i - 6) * m.letterW + m.letterW / 2 + kern;
      const chS = sybilChars[i];
      const chC = sofiaChars[i];
      if (kernAfterSybil[chS]) kern += m.letterW * kernAfterSybil[chS];
      if (kernAfterSofia[chC]) kern += m.letterW * kernAfterSofia[chC];
    }
    slot.y = anchorY;
  }
}

/* ── Initial placement (Sofia invisible for reveal, Sybil hidden) ── */
function initPositions() {
  calcPositions();
  const m = getLetterMetrics();
  for (const slot of slots) {
    slot.sofiaEl.style.height = m.letterH + 'px';
    slot.sybilEl.style.height = m.letterH + 'px';
    if (revealComplete) {
      // After reveal, snap active name to final positions
      const activeEl = currentName === 'sofia' ? slot.sofiaEl : slot.sybilEl;
      const inactiveEl = currentName === 'sofia' ? slot.sybilEl : slot.sofiaEl;
      gsap.set(activeEl, {
        x: slot.x - m.offsetX,
        y: slot.y - m.offsetY,
        rotation: slot.restRot,
        opacity: 0.9
      });
      gsap.set(inactiveEl, {
        x: slot.x - m.offsetX,
        y: slot.y - m.offsetY - (m.swapDist || 55),
        rotation: slot.restRot,
        opacity: 0
      });
    } else {
      // Before/during reveal: invisible, above viewport
      gsap.set(slot.sofiaEl, {
        x: slot.x - m.offsetX,
        y: -80,
        rotation: 0,
        opacity: 0
      });
      gsap.set(slot.sybilEl, {
        x: slot.x - m.offsetX,
        y: slot.y - m.offsetY - (m.swapDist || 55),
        rotation: slot.restRot,
        opacity: 0
      });
    }
  }
}

/* ══════════════════════════════════════════
   Matter.js Physics (unified desktop/mobile)
   ══════════════════════════════════════════ */

function getConfig() {
  return isMobile() ? {
    gravity: 1.2, positionIter: 8, velocityIter: 6,
    floorPadRatio: 0.03, wallThick: 60, wallInset: 0.01,
    wallLeftInsetX: 0.1, wallRightInsetX: 0.004,
    swapVelXRange: 1.5,
    rainDelayBase: 45, rainDelayJitter: 30, rainStartYAbsolute: false,
    rainXJitter: 30, rainRestitution: 0.3, rainFrictionAir: 0.008,
    rainAngleRange: 0.4, rainVelXRange: 1, rainVelYBase: 1.5, rainVelYJitter: 1,
    settleIndividual: true,
    sofiaFallVelXRange: 0.5, sofiaFallVelYBase: 1.5, sofiaFallVelYJitter: 1,
    swapDistFallback: 30,
  } : {
    gravity: 1.5, positionIter: 10, velocityIter: 8,
    floorPadRatio: 0.0175, wallThick: 80, wallInset: 0.015,
    wallLeftInsetX: 0.0475, wallRightInsetX: 0.019,
    swapVelXRange: 2,
    rainDelayBase: 55, rainDelayJitter: 35, rainStartYAbsolute: true,
    rainXJitter: 40, rainRestitution: 0.35, rainFrictionAir: 0.006,
    rainAngleRange: 0.6, rainVelXRange: 2, rainVelYBase: 2.5, rainVelYJitter: 2,
    settleIndividual: false,
    sofiaFallVelXRange: 0.8, sofiaFallVelYBase: 2, sofiaFallVelYJitter: 1.5,
    swapDistFallback: 55,
  };
}
let C = getConfig();

const { Engine, World, Bodies, Body, Runner, Events } = Matter;
const engine = Engine.create({
  gravity: { x: 0, y: C.gravity },
  enableSleeping: true,
  positionIterations: C.positionIter,
  velocityIterations: C.velocityIter,
});
const world = engine.world;
const runner = Runner.create();
Runner.run(runner, engine);

/* ── Physics state ── */
const debrisPairs = [];
const sofiaFallPairs = [];
let flushing = false;
let swapCount = 0;
let firstTapDone = false;
let settledCount = 0;
const revealPairs = [];
let loadingPhase = 0;
let revealRecalced = false;
let _resizeTimer;
let _resizeCleaned = false;
let _resizing = false;
let _rainGen = 0;
const _rainTimers = [];
function clearRainTimers() {
  for (const tid of _rainTimers) clearTimeout(tid);
  _rainTimers.length = 0;
}
let breatheTL = null;

/* ── Build boundary walls ── */
function buildWalls() {
  const oldStatic = world.bodies.filter(b => b.isStatic && b.label === 'wall');
  World.remove(world, oldStatic);

  // Measure at scale 1 so floor position is consistent during entrance animation
  const curScale = gsap.getProperty(frameWrap, 'scale') || 1;
  if (curScale !== 1) gsap.set(frameWrap, { scale: 1 });
  const fr = frameWrap.getBoundingClientRect();
  if (curScale !== 1) gsap.set(frameWrap, { scale: curScale });
  const thick = C.wallThick;
  const floorPad = fr.height * C.floorPadRatio + fr.width * C.wallInset;
  const wallFilter = { category: 0x0004, mask: 0xFFFF };
  // Floor
  World.add(world, Bodies.rectangle(
    fr.left + fr.width / 2, fr.bottom - floorPad + thick / 2, fr.width * 1.4, thick,
    { isStatic: true, label: 'wall', restitution: 0.3, friction: 0.6, collisionFilter: wallFilter }
  ));
  // Left wall — inner face at fr.left + wallLeftInsetX * width
  World.add(world, Bodies.rectangle(
    fr.left + fr.width * C.wallLeftInsetX - thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
    { isStatic: true, label: 'wall', collisionFilter: wallFilter }
  ));
  // Right wall — inner face at fr.right - wallRightInsetX * width
  World.add(world, Bodies.rectangle(
    fr.right - fr.width * C.wallRightInsetX + thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
    { isStatic: true, label: 'wall', collisionFilter: wallFilter }
  ));
}

/* ── Desktop: fly letters from rain pile to final positions ── */
function flyToFinalPositions(onAllSettled) {
  // Sync GSAP to physics pile positions, then remove physics
  const m = getLetterMetrics();
  for (const pair of revealPairs) {
    if (!pair.settled) {
      const pos = pair.body.position;
      const ang = pair.body.angle * (180 / Math.PI);
      gsap.set(pair.el, {
        x: pos.x - m.offsetX,
        y: pos.y - m.offsetY,
        rotation: ang,
        opacity: 0.9,
      });
      if (world.bodies.includes(pair.body)) {
        World.remove(world, pair.body);
      }
      pair.settled = true;
    }
  }
  // Temporarily measure at scale 1 so positions match the final frame size
  const currentScale = gsap.getProperty(frameWrap, 'scale') || 0.85;
  gsap.set(frameWrap, { scale: 1 });
  invalidateMetrics();
  calcPositions();
  gsap.set(frameWrap, { scale: currentScale });
  invalidateMetrics();

  // Letters fly from pile to final position above frame
  let completed = 0;
  slots.forEach((slot, idx) => {
    gsap.to(slot.sofiaEl, {
      x: slot.x - m.offsetX,
      y: slot.y - m.offsetY,
      rotation: slot.restRot,
      duration: 0.7,
      delay: idx * 0.03 + Math.random() * 0.02,
      ease: 'power2.inOut',
      onComplete: () => {
        completed++;
        if (completed >= slots.length) {
          buildWalls();
          markRevealComplete();
          frameWrap.style.cursor = '';
          if (onAllSettled) onAllSettled();
        }
      }
    });
  });
}

/* ── Mobile: settle individual letter from physics to final pos ── */
function settleLetter(pair) {
  if (pair.settled) return;
  pair.settled = true;

  const pos = pair.body.position;
  const ang = pair.body.angle * (180 / Math.PI);
  const m = getLetterMetrics();

  World.remove(world, pair.body);

  gsap.fromTo(pair.el,
    { x: pos.x - m.offsetX, y: pos.y - m.offsetY, rotation: ang },
    {
      x: pair.slot.x - m.offsetX,
      y: pair.slot.y - m.offsetY,
      rotation: pair.slot.restRot,
      duration: 0.5, ease: 'power2.out',
      onComplete: () => {
        settledCount++;
        if (settledCount >= slots.length) { markRevealComplete(); startBreathe(); }
      }
    }
  );
}

/* ── Mobile: breathe pulse until first tap ── */
function startBreathe() {
  breatheTL = gsap.timeline({ repeat: -1, yoyo: true });
  breatheTL.to(slots.map(s => s.sofiaEl), {
    scale: 1.1, y: '-=3', duration: 1.4, ease: 'sine.inOut', stagger: 0.05,
  });
}
function stopBreathe() {
  if (!breatheTL) return;
  breatheTL.kill();
  breatheTL = null;
  for (const slot of slots) {
    gsap.to(slot.sofiaEl, { scale: 1, y: slot.y - getLetterMetrics().offsetY, duration: 0.3, ease: 'power2.out' });
  }
}

/* ── Swap: new letter drops from top, old one becomes physics debris ── */
function swapTo(name) {
  if (name === currentName || flushing) return;
  if (isMobile()) stopBreathe();
  // If this swap would trigger flush, just bump the count and bail
  if (swapCount + 1 >= 40) {
    swapCount++;
    return;
  }

  currentName = name;
  calcPositions();
  swapCount++;

  // Mobile: toggle bg photo on tap
  if (isMobile()) {
    if (!firstTapDone) {
      firstTapDone = true;
      gsap.to(bgSybilEl, { opacity: 1, duration: 0.6, delay: 0.1, ease: 'power2.inOut', overwrite: true });
    } else {
      const showSybil = name === 'sybil';
      gsap.to(bgSybilEl, {
        opacity: showSybil ? 1 : 0,
        duration: 0.2, delay: 0, ease: 'power2.inOut', overwrite: true,
      });
    }
  }

  const m = getLetterMetrics();

  slots.forEach((slot, idx) => {
    const outEl = name === 'sybil' ? slot.sofiaEl : slot.sybilEl;
    const inEl = name === 'sybil' ? slot.sybilEl : slot.sofiaEl;
    const baseY = slot.y - m.offsetY;
    const delay = idx * 0.03 + Math.random() * 0.04;

    // Kill any in-flight tweens and snap to resting position before cloning
    gsap.killTweensOf(outEl);
    gsap.killTweensOf(inEl);
    gsap.set(outEl, { x: slot.x - m.offsetX, y: baseY, rotation: slot.restRot, opacity: 0.9 });

    // Clone the outgoing letter as debris from its correct position
    const debris = outEl.cloneNode(true);
    debris.style.pointerEvents = 'none';
    letterField.appendChild(debris);

    // Mobile: defer hide to next frame for GPU; Desktop: immediate
    if (isMobile()) {
      requestAnimationFrame(() => {
        gsap.set(outEl, { opacity: 0, y: baseY - m.swapDist });
      });
    } else {
      gsap.set(outEl, { opacity: 0, y: baseY - m.swapDist });
    }

    setTimeout(() => {
      const body = Bodies.rectangle(slot.x, slot.y, m.letterW * 0.7, m.letterH * 0.65, {
        restitution: 0.35,
        friction: 0.5,
        frictionAir: 0.01,
        angle: slot.restRot * Math.PI / 180,
        density: 0.002,
        sleepThreshold: 30,
      });
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * C.swapVelXRange,
        y: 0
      });
      World.add(world, body);
      debrisPairs.push({ el: debris, body, born: performance.now() });
      debris.style.opacity = '0.9';
    }, delay * 1000);

    gsap.fromTo(inEl,
      { x: slot.x - m.offsetX, y: baseY - m.swapDist, rotation: slot.restRot, opacity: 0 },
      { y: baseY, opacity: 0.9, duration: 0.4, delay: delay + 0.06, ease: 'power2.out', overwrite: true }
    );
  });
}

/* ── Physics sync loop ── */
Events.on(engine, 'afterUpdate', () => {
  const m = getLetterMetrics();

  // Sync reveal letters to physics bodies (during pile/rain phase)
  let needsRecalc = false;
  for (const pair of revealPairs) {
    if (pair.settled) continue;
    const pos = pair.body.position;
    const ang = pair.body.angle * (180 / Math.PI);
    pair.el.style.transform = `translate(${pos.x - m.offsetX}px, ${pos.y - m.offsetY}px) rotate(${ang}deg)`;

    if (C.settleIndividual) {
      const alive = performance.now() - pair.born;
      if (alive > 800 && pair.body.speed < 0.4) needsRecalc = true;
    }
  }

  // Mobile: settle individually when slow enough
  if (C.settleIndividual) {
    if (needsRecalc && !revealRecalced) {
      revealRecalced = true;
      calcPositions();
    }
    for (const pair of revealPairs) {
      if (pair.settled) continue;
      const alive = performance.now() - pair.born;
      if (alive > 800 && pair.body.speed < 0.4) settleLetter(pair);
    }
  }

  // Sync swap debris
  const dox = m.offsetX;
  const doy = m.offsetY;
  for (const pair of debrisPairs) {
    const pos = pair.body.position;
    const ang = pair.body.angle * (180 / Math.PI);
    pair.el.style.transform = `translate(${pos.x - dox}px, ${pos.y - doy}px) rotate(${ang}deg)`;
  }

  // Sync sofia fall bodies
  for (const pair of sofiaFallPairs) {
    if (pair.settled) continue;
    const pos = pair.body.position;
    const ang = pair.body.angle * (180 / Math.PI);
    pair.el.style.transform = `translate(${pos.x - m.offsetX}px, ${pos.y - m.offsetY}px) rotate(${ang}deg)`;
  }

  // ── Flush check: 40+ swaps or debris reaches top ──
  if (!flushing && !_resizing && debrisPairs.length > 0) {
    const fr = frameWrap.getBoundingClientRect();
    const pad = fr.height * C.floorPadRatio;
    const topEdge = fr.top + pad;
    const now = performance.now();

    let shouldFlush = swapCount >= 40;

    if (!shouldFlush) {
      for (const pair of debrisPairs) {
        if (pair.born && now - pair.born < 500) continue;
        if (pair.body.position.y <= topEdge) { shouldFlush = true; break; }
      }
    }

    if (shouldFlush) {
        flushing = true;
        revealComplete = false;

        // Reset visuals (desktop resets hover state, mobile resets tap state)
        if (isMobile()) {
          gsap.to(bgSybilEl, { opacity: 0, duration: 0.3, ease: 'power2.out', overwrite: true });
          firstTapDone = false;
        } else {
          gsap.to(bgSybilEl, { opacity: 0, duration: 0.3, ease: 'power2.out', x: 0, overwrite: true });
          gsap.to(bgHoverEl, { clipPath: 'inset(0 100% 0 0)', duration: 0.4, ease: 'power2.out', overwrite: true });
          gsap.to(frameBorderEl, { opacity: 0, x: 0, duration: 0.4, ease: 'power2.out', overwrite: true });
          firstHoverDone = false;
        }

        const flushM = getLetterMetrics();
        const thick = C.wallThick;
        const floorPad = fr.height * C.floorPadRatio + fr.width * C.wallInset;

        // Kill any in-flight swap tweens and hide ALL slot letters
        for (const slot of slots) {
          gsap.killTweensOf(slot.sofiaEl);
          gsap.killTweensOf(slot.sybilEl);
          gsap.set(slot.sofiaEl, { opacity: 0 });
          gsap.set(slot.sybilEl, { opacity: 0 });
        }

        // Remove the main floor — debris falls through
        const floorBodies = world.bodies.filter(b => b.isStatic && b.label === 'wall');
        const mainFloor = floorBodies.find(b => b.position.y > fr.top + fr.height * 0.5);
        if (mainFloor) World.remove(world, mainFloor);

        // Private floor + walls only sofia bodies can collide with
        const sofiaFloor = Bodies.rectangle(
          fr.left + fr.width / 2,
          fr.bottom - floorPad + thick / 2,
          fr.width * 1.4, thick,
          { isStatic: true, label: 'sofiaFloor', restitution: 0.3, friction: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0004 } }
        );
        World.add(world, sofiaFloor);

        // Sofia walls use same ratios as main walls
        const sofiaLeftWall = Bodies.rectangle(
          fr.left + fr.width * C.wallLeftInsetX - thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
          { isStatic: true, label: 'sofiaWall', restitution: 0.3, friction: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0004 } }
        );
        const sofiaRightWall = Bodies.rectangle(
          fr.right - fr.width * C.wallRightInsetX + thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
          { isStatic: true, label: 'sofiaWall', restitution: 0.3, friction: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0004 } }
        );
        World.add(world, [sofiaLeftWall, sofiaRightWall]);

        // Wake up all debris and nudge downward so they fall through
        for (const dp of debrisPairs) {
          if (dp.body.isSleeping) Matter.Sleeping.set(dp.body, false);
          Body.setVelocity(dp.body, {
            x: dp.body.velocity.x,
            y: Math.max(dp.body.velocity.y, 3),
          });
        }

        // Create sofia physics bodies — collide with sofiaFloor only
        for (const slot of slots) {
          gsap.set(slot.sofiaEl, { opacity: 0.9 });
          const body = Bodies.rectangle(slot.x, slot.y - 20, flushM.letterW * 0.7, flushM.letterH * 0.65, {
            restitution: 0.4, friction: 0.8, frictionAir: 0.005,
            angle: (Math.random() - 0.5) * 0.3, density: 0.004, sleepThreshold: 300,
            collisionFilter: { category: 0x0004, mask: 0x0002 },
          });
          Body.setVelocity(body, {
            x: (Math.random() - 0.5) * C.sofiaFallVelXRange,
            y: C.sofiaFallVelYBase + Math.random() * C.sofiaFallVelYJitter,
          });
          World.add(world, body);
          sofiaFallPairs.push({ el: slot.sofiaEl, body, slot, born: performance.now() });
        }

        // Fixed delay: let sofia letters fall for 750ms, then clean up and rise
        setTimeout(() => {
          // Capture positions and remove physics
          const m2 = getLetterMetrics();
          for (const pair of sofiaFallPairs) {
            const pos = pair.body.position;
            const ang = pair.body.angle * (180 / Math.PI);
            pair.capturedX = pos.x - m2.offsetX;
            pair.capturedY = pos.y - m2.offsetY;
            pair.capturedRot = ang;
            pair.settled = true;
            World.remove(world, pair.body);
            gsap.set(pair.el, { x: pair.capturedX, y: pair.capturedY, rotation: pair.capturedRot });
          }

          // Remove sofia floor and walls
          World.remove(world, sofiaFloor);
          if (!isMobile()) {
            World.remove(world, sofiaLeftWall);
            World.remove(world, sofiaRightWall);
          }

          // Clean up debris
          for (const dp of debrisPairs) {
            World.remove(world, dp.body);
            dp.el.remove();
          }
          debrisPairs.length = 0;
          swapCount = 0;

          // Small pause on the floor, then rise
          setTimeout(() => {
            buildWalls();
            currentName = 'sofia';
            clearRainTimers();
            revealPairs.length = 0;
            revealStarted = false;
            revealRecalced = false;
            if (isMobile()) settledCount = 0;

            calcPositions();
            const mRise = getLetterMetrics();

            for (const slot of slots) {
              gsap.set(slot.sybilEl, {
                x: slot.x - mRise.offsetX,
                y: slot.y - mRise.offsetY - (mRise.swapDist || C.swapDistFallback),
                rotation: slot.restRot,
                opacity: 0,
              });
            }

            // Rise from floor to name position (staggered like letter rain)
            let completed = 0;
            sofiaFallPairs.forEach((pair, idx) => {
              gsap.fromTo(pair.el,
                { x: pair.capturedX, y: pair.capturedY, rotation: pair.capturedRot },
                {
                  x: pair.slot.x - mRise.offsetX,
                  y: pair.slot.y - mRise.offsetY,
                  rotation: pair.slot.restRot,
                  duration: 0.7,
                  ease: 'power2.out',
                  delay: idx * 0.045 + Math.random() * 0.03,
                  onComplete: () => {
                    completed++;
                    if (completed >= sofiaFallPairs.length) {
                      sofiaFallPairs.length = 0;
                      markRevealComplete();
                      if (!isMobile()) frameWrap.style.cursor = '';
                      flushing = false;
                    }
                  }
                }
              );
            });
          }, 400);
        }, 1750);
    }
  }
});

/* ── Letter rain (reveal animation) ── */
function startRain() {
  if (revealStarted) return;
  revealStarted = true;
  const m = getLetterMetrics();
  const fr = frameWrap.getBoundingClientRect();
  const gen = _rainGen;

  clearRainTimers();
  slots.forEach((slot, idx) => {
    const delay = idx * C.rainDelayBase + Math.random() * C.rainDelayJitter;
    const tid = setTimeout(() => {
      if (_rainGen !== gen) return;
      gsap.set(slot.sofiaEl, { opacity: 0.9 });

      const startX = slot.x + (Math.random() - 0.5) * C.rainXJitter;
      const startY = C.rainStartYAbsolute
        ? -60 - Math.random() * 100
        : fr.top - 40 - Math.random() * 60;

      const body = Bodies.rectangle(startX, startY, m.letterW * 0.7, m.letterH * 0.65, {
        restitution: C.rainRestitution, friction: 0.5, frictionAir: C.rainFrictionAir,
        angle: (Math.random() - 0.5) * C.rainAngleRange, density: 0.003, sleepThreshold: 60,
      });
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * C.rainVelXRange,
        y: C.rainVelYBase + Math.random() * C.rainVelYJitter,
      });
      World.add(world, body);
      revealPairs.push({ el: slot.sofiaEl, body, slot, settled: false, born: performance.now() });
    }, delay);
    _rainTimers.push(tid);
  });

  if (!C.settleIndividual) {
    // Desktop: wait for all letters to settle, then fly to final positions
    const checkSettled = () => {
      if (_rainGen !== gen) return;
      if (revealPairs.length < slots.length) { requestAnimationFrame(checkSettled); return; }
      const now = performance.now();
      const allSlow = revealPairs.every(p =>
        p.settled || (now - p.born > 600 && p.body.speed < 0.6)
      );
      if (!allSlow) { requestAnimationFrame(checkSettled); return; }
      flyToFinalPositions(() => { loadingPhase = 0; });
    };
    _rainTimers.push(setTimeout(() => { if (_rainGen !== gen) return; checkSettled(); }, 1200));

    // Safety timeout
    _rainTimers.push(setTimeout(() => {
      if (_rainGen !== gen || revealComplete) return;
      for (const pair of revealPairs) {
        if (!pair.settled && world.bodies.includes(pair.body)) World.remove(world, pair.body);
        pair.settled = true;
      }
      flyToFinalPositions(() => { loadingPhase = 0; });
    }, 5000));
  } else {
    // Mobile: individual settling happens in afterUpdate; safety timeout
    _rainTimers.push(setTimeout(() => {
      if (_rainGen !== gen) return;
      calcPositions();
      for (const pair of revealPairs) {
        if (!pair.settled) settleLetter(pair);
      }
    }, 4000));
  }
}

/* ── Resize handler ── */
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizing = true;

  // On first resize event: immediately wipe everything
  if (!_resizeCleaned) {
    _resizeCleaned = true;
    _rainGen++;
    clearRainTimers();
    flushing = false;

    // Remove debris clones + physics
    for (const dp of debrisPairs) {
      World.remove(world, dp.body);
      dp.el.remove();
    }
    debrisPairs.length = 0;

    // Remove sofia-fall bodies
    for (const pair of sofiaFallPairs) {
      if (!pair.settled && world.bodies.includes(pair.body))
        World.remove(world, pair.body);
    }
    sofiaFallPairs.length = 0;

    // Remove reveal bodies
    for (const pair of revealPairs) {
      if (!pair.settled && world.bodies.includes(pair.body))
        World.remove(world, pair.body);
    }
    revealPairs.length = 0;

    // Remove flush-specific static bodies (sofiaFloor, sofiaWall)
    const flushBodies = world.bodies.filter(b => b.isStatic && (b.label === 'sofiaFloor' || b.label === 'sofiaWall'));
    if (flushBodies.length) World.remove(world, flushBodies);

    // Kill tweens and hide all letters
    if (isMobile()) stopBreathe();
    for (const slot of slots) {
      gsap.killTweensOf(slot.sofiaEl);
      gsap.killTweensOf(slot.sybilEl);
      gsap.set(slot.sofiaEl, { opacity: 0 });
      gsap.set(slot.sybilEl, { opacity: 0 });
    }

    // Reset state
    currentName = 'sofia';
    revealComplete = false;
    revealStarted = false;
    revealRecalced = false;
    swapCount = 0;

    if (isMobile()) {
      settledCount = 0;
      firstTapDone = false;
      gsap.set(bgSybilEl, { opacity: 0 });
    } else {
      loadingPhase = 0;
      firstHoverDone = false;
      gsap.set(bgSybilEl, { opacity: 0, x: 0 });
      gsap.set(bgHoverEl, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(frameBorderEl, { opacity: 0, x: 0 });
    }
  }

  // After resize stops: rebuild
  _resizeTimer = setTimeout(() => {
    _resizeCleaned = false;
    _resizing = false;
    C = getConfig();
    engine.gravity.y = C.gravity;
    engine.positionIterations = C.positionIter;
    engine.velocityIterations = C.velocityIter;
    invalidateMetrics();
    buildWalls();

    if (isMobile()) {
      initPositions();
      startRain();
    } else {
      calcPositions();
      const m = getLetterMetrics();
      for (const slot of slots) {
        slot.sofiaEl.style.height = m.letterH + 'px';
        slot.sybilEl.style.height = m.letterH + 'px';
        const activeEl = currentName === 'sofia' ? slot.sofiaEl : slot.sybilEl;
        gsap.set(activeEl, {
          x: slot.x - m.offsetX,
          y: slot.y - m.offsetY,
          rotation: slot.restRot,
          opacity: 0.9,
        });
      }
      markRevealComplete();
      revealStarted = true;
      frameWrap.style.cursor = '';
    }

    bindListeners();
  }, 300);
});

/* ── Preload critical images before entrance ── */
function preloadImages() {
  const mobile = isMobile();
  const srcs = [
    'https://cdn.jsdelivr.net/gh/kjoshh/sofia-portfolio@main/images-neu/heroimg-sofia.jpg',
    mobile ? 'https://cdn.jsdelivr.net/gh/kjoshh/sofia-portfolio@main/images-neu/frame-mobile.png' : 'https://cdn.jsdelivr.net/gh/kjoshh/sofia-portfolio@main/images-neu/frame-desk.png',
  ];

  const promises = srcs.map(src => new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = () => { console.warn('Failed to preload:', src); resolve(); };
    img.src = src;
  }));

  // Timeout fallback — never wait longer than 4s
  const timeout = new Promise(resolve => setTimeout(resolve, 4000));
  return Promise.race([Promise.all(promises), timeout]);
}

/* ── Init + entrance ── */
initPositions();

preloadImages().then(() => {
  const mobile = isMobile();

  // Show wait cursor on frame until letter rain finishes
  frameWrap.style.cursor = 'wait';

  if (mobile) {
    /* ── Mobile entrance: scale-up frame + letter rain ── */
    gsap.set(frameWrap, { scale: 0.85, opacity: 0, y: 30 });

    const revealTL = gsap.timeline({ delay: 1.4 });
    revealTL.to(sceneEl, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0);
    revealTL.to(frameWrap, {
      scale: 1, opacity: 1, y: 0,
      duration: 1.4, ease: 'power2.out',
    }, 0);

    // Build walls + start letter rain after frame arrives
    revealTL.call(() => {
      calcPositions();
      buildWalls();
      startRain();
    }, null, 1.2);

  } else {
    /* ── Desktop entrance: animated reveal + letter rain ── */
    gsap.set(frameWrap, { opacity: 0, scale: 0.8, transformOrigin: '50% 100%' });
    gsap.set(outerBorder, { opacity: 0 });
    gsap.set('.main-nav', { opacity: 0, y: -15 });

    // Animate everything in (delay synced with page-transition overlay fade)
    const entranceTL = gsap.timeline({ delay: 1.4 });
    entranceTL.to(sceneEl, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0);
    entranceTL.to(frameWrap, { opacity: 1, scale: 1, duration: 1.5, ease: 'power2.inOut' }, 0);
    entranceTL.to(outerBorder, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);
    entranceTL.to('.main-nav', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.3);
    entranceTL.to('.nav-star-sep', { opacity: 0.55, duration: 0.5 }, 0.5);

    // Start letter rain once frame is mostly visible
    setTimeout(() => {
      initPositions();
      buildWalls();
      startRain();
    }, 1900);
  }
});

/* ── Floating dust particles ── */
(function () {
  const canvas = document.getElementById('dustCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    requestAnimationFrame(() => {
      W = canvas.width = vw;
      H = canvas.height = vh;
    });
  }
  resize();
  window.addEventListener('resize', resize);

  const NUM = isMobile() ? 30 : 65;
  const particles = [];

  for (let i = 0; i < NUM; i++) {
    const warmth = Math.random();
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.4 + Math.random() * 1.25,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 - Math.random() * 0.12,
      alpha: 0.08 + Math.random() * 0.18,
      cr: 200 + Math.floor(warmth * 55),
      cg: 180 + Math.floor(warmth * 40),
      cb: 150 + Math.floor(warmth * 30),
      drift: Math.random() * Math.PI * 2,
      driftSpeed: 0.003 + Math.random() * 0.006,
      driftAmp: 0.2 + Math.random() * 0.4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      shape: (() => {
        const n = 5 + Math.floor(Math.random() * 3);
        return Array.from({ length: n }, (_, j) => ({
          angle: (j / n) * Math.PI * 2,
          wobble: 0.55 + Math.random() * 0.9,
        }));
      })(),
    });
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.drift += p.driftSpeed;
      p.x += p.vx + Math.sin(p.drift) * p.driftAmp;
      p.y += p.vy;

      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;

      p.rot += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      const pts = p.shape;
      const n = pts.length;
      const px0 = Math.cos(pts[0].angle) * p.r * pts[0].wobble;
      const py0 = Math.sin(pts[0].angle) * p.r * pts[0].wobble;
      const px1 = Math.cos(pts[1 % n].angle) * p.r * pts[1 % n].wobble;
      const py1 = Math.sin(pts[1 % n].angle) * p.r * pts[1 % n].wobble;
      ctx.moveTo((px0 + px1) / 2, (py0 + py1) / 2);
      for (let k = 1; k <= n; k++) {
        const cur = pts[k % n];
        const nxt = pts[(k + 1) % n];
        const cx = Math.cos(cur.angle) * p.r * cur.wobble;
        const cy = Math.sin(cur.angle) * p.r * cur.wobble;
        const nx = Math.cos(nxt.angle) * p.r * nxt.wobble;
        const ny = Math.sin(nxt.angle) * p.r * nxt.wobble;
        ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.alpha})`;
      ctx.fill();
      ctx.restore();
    }

    if (!dustPaused) requestAnimationFrame(tick);
  }
  let dustPaused = false;
  requestAnimationFrame(tick);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { dustPaused = true; }
    else { dustPaused = false; requestAnimationFrame(tick); }
  });
})();
