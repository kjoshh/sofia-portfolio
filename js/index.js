/* ── Refs ── */

const letterField = document.getElementById('letterField');
const frameWrap = document.getElementById('frameWrap');
const sceneEl = document.getElementById('scene');

/* ── Mobile detection ── */
const isMobile = window.matchMedia('(max-width: 991px)').matches;

/* ── State ── */
let currentName = 'sofia';
let revealComplete = false;
let revealStarted = false;

/* ── Hover triggers ── */
const bgHoverEl = document.getElementById('bgHover');
const frameBorderEl = document.getElementById('frameBorderHover');
const outerBorder = frameWrap.querySelector('.frame-border');
const framePhotoEl = document.getElementById('bg');

/* Clock-sweep clip-path: sweeps clockwise from top-left corner */
function clockWipe(progress) {
  const sweep = progress * 360;
  const pts = ['50% 50%', '0% 0%'];
  const corners = [
    { rel: 90,  p: '100% 0%' },
    { rel: 180, p: '100% 100%' },
    { rel: 270, p: '0% 100%' },
  ];
  for (const c of corners) {
    if (sweep > c.rel) pts.push(c.p);
  }
  if (progress >= 1) {
    pts.push('0% 0%');
  } else {
    const absAngle = (315 + sweep) % 360;
    const rad = (absAngle - 90) * Math.PI / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const adx = Math.abs(dx), ady = Math.abs(dy);
    let s;
    if (adx < 1e-6) s = 50 / ady;
    else if (ady < 1e-6) s = 50 / adx;
    else s = Math.min(50 / adx, 50 / ady);
    pts.push(`${(50 + dx * s).toFixed(1)}% ${(50 + dy * s).toFixed(1)}%`);
  }
  return `polygon(${pts.join(', ')})`;
}

/* ── Hover ── */
let firstHoverDone = false;
const bgSybilEl = document.getElementById('bgSybil');
let sweepTween = null;
let sweepObj = { progress: 0 };

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
  gsap.to(sceneEl, { scale: 1.014, duration: 0.7, ease: 'power2.out', overwrite: true });
}

function hoverOut() {
  if (!revealComplete) return;
  gsap.to(sceneEl, { scale: 1, duration: 0.7, ease: 'power2.inOut', overwrite: true });
}

if (!isMobile) {
  frameWrap.addEventListener('mouseenter', hoverIn);
  frameWrap.addEventListener('mouseleave', hoverOut);
}

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
  if (isMobile) {
    return {
      letterH: fw * 0.065,
      letterW: fw * 0.056,
      spaceW:  fw * 0.052,
      swapDist: fw * 0.075,
      offsetX: fw * 0.02,
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
  sofiaEl.src = `brand_assets/Letters/${sc}.png`;
  sofiaEl.alt = sc;
  letterField.appendChild(sofiaEl);

  const sybilEl = document.createElement('img');
  sybilEl.className = 'letter-el';
  sybilEl.src = `brand_assets/Letters/${yc}.png`;
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

  const kernAfter = { m: isMobile ? 0.5 : 0.3 };
  let kern = 0;

  for (const slot of slots) {
    const i = slot.nameIndex;
    if (i < 5) {
      slot.x = startX + i * m.letterW + m.letterW / 2;
    } else {
      slot.x = startX + 5 * m.letterW + m.spaceW + (i - 6) * m.letterW + m.letterW / 2 + kern;
      const ch = sybilChars[i];
      if (kernAfter[ch]) kern += m.letterW * kernAfter[ch];
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

/* ── Matter.js physics world (desktop only) ── */
if (!isMobile) {
const { Engine, World, Bodies, Body, Runner, Events } = Matter;
const engine = Engine.create({
  gravity: { x: 0, y: 1.5 },
  enableSleeping: true,
  positionIterations: 10,
  velocityIterations: 8,
});
const world = engine.world;
const runner = Runner.create();
Runner.run(runner, engine);

const debrisPairs = [];
const sofiaFallPairs = [];
let flushing = false;
let swapCount = 0;

const FLOOR_PAD_RATIO = 0.03;

function buildWalls() {
  const oldStatic = world.bodies.filter(b => b.isStatic && b.label === 'wall');
  World.remove(world, oldStatic);

  const fr = frameWrap.getBoundingClientRect();
  const pad = fr.height * FLOOR_PAD_RATIO;
  const thick = 80;
  const inset = fr.width * 0.007;
  const wallFilter = { category: 0x0004, mask: 0xFFFF };
  // Floor
  World.add(world, Bodies.rectangle(
    fr.left + fr.width / 2, fr.bottom - pad - inset + thick / 2, fr.width * 1.4, thick,
    { isStatic: true, label: 'wall', restitution: 0.3, friction: 0.6, collisionFilter: wallFilter }
  ));
  // Left wall
  World.add(world, Bodies.rectangle(
    fr.left + pad + inset - thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
    { isStatic: true, label: 'wall', collisionFilter: wallFilter }
  ));
  // Right wall
  World.add(world, Bodies.rectangle(
    fr.right - pad - inset + thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
    { isStatic: true, label: 'wall', collisionFilter: wallFilter }
  ));
}
buildWalls();
/* ── Desktop resize: clean up immediately, re-rain after debounce ── */
let _resizeTimer;
let _resizeCleaned = false;
window.addEventListener('resize', () => {
  if (flushing) return;
  clearTimeout(_resizeTimer);

  // On first resize event: immediately wipe everything
  if (!_resizeCleaned) {
    _resizeCleaned = true;

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

    // Kill tweens and hide all letters
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
    settledCount = 0;
    swapCount = 0;
    firstHoverDone = false;

    // Reset hover visuals
    gsap.set(bgSybilEl, { opacity: 0, x: 0 });
    gsap.set(bgHoverEl, { clipPath: 'inset(0 100% 0 0)' });
    gsap.set(frameBorderEl, { opacity: 0, x: 0 });
  }

  // After resize stops: rebuild and re-rain
  _resizeTimer = setTimeout(() => {
    _resizeCleaned = false;
    buildWalls();
    initPositions();
    startLetterRain();
  }, 300);
});

/* ── Letter rain reveal ── */
const revealPairs = [];
let settledCount = 0;

function startLetterRain() {
  if (revealStarted) return;
  revealStarted = true;
  frameWrap.style.cursor = 'wait';
  const m = getLetterMetrics();
  const fr = frameWrap.getBoundingClientRect();

  slots.forEach((slot, idx) => {
    const delay = idx * 45 + Math.random() * 30;

    setTimeout(() => {
      // Make visible just before dropping
      gsap.set(slot.sofiaEl, { opacity: 0.9 });

      // Create physics body above viewport, spread horizontally near final x
      const startX = slot.x + (Math.random() - 0.5) * 40;
      const startY = fr.top - 60 - Math.random() * 80;

      const body = Bodies.rectangle(startX, startY, m.letterW * 0.7, m.letterH * 0.65, {
        restitution: 0.3,
        friction: 0.5,
        frictionAir: 0.008,
        angle: (Math.random() - 0.5) * 0.4,
        density: 0.003,
        sleepThreshold: 60,
      });
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 1.5,
        y: 2 + Math.random() * 1.5,
      });
      World.add(world, body);

      revealPairs.push({
        el: slot.sofiaEl,
        body,
        slot,
        settled: false,
        born: performance.now(),
      });
    }, delay);
  });

  // Safety timeout: force-settle any remaining after 4s
  setTimeout(() => {
    calcPositions();
    for (const pair of revealPairs) {
      if (!pair.settled) settleLetter(pair);
    }
  }, 4000);
}

function settleLetter(pair) {
  if (pair.settled) return;
  pair.settled = true;

  const pos = pair.body.position;
  const ang = pair.body.angle * (180 / Math.PI);
  const m = getLetterMetrics();

  // Remove physics body
  World.remove(world, pair.body);

  // Tween from current physics position to final slot position
  gsap.fromTo(pair.el,
    { x: pos.x - m.offsetX, y: pos.y - m.offsetY, rotation: ang },
    {
      x: pair.slot.x - m.offsetX,
      y: pair.slot.y - m.offsetY,
      rotation: pair.slot.restRot,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        settledCount++;
        if (settledCount >= slots.length) {
          revealComplete = true;
          frameWrap.style.cursor = '';
        }
      }
    }
  );
}

let revealRecalced = false;

Events.on(engine, 'afterUpdate', () => {
  // Sync reveal letters to physics bodies
  let needsRecalc = false;
  for (const pair of revealPairs) {
    if (pair.settled) continue;
    const pos = pair.body.position;
    const ang = pair.body.angle * (180 / Math.PI);
    const m = getLetterMetrics();
    pair.el.style.transform = `translate(${pos.x - m.offsetX}px, ${pos.y - m.offsetY}px) rotate(${ang}deg)`;

    // Check if settled enough to snap
    const alive = performance.now() - pair.born;
    if (alive > 800 && pair.body.speed < 0.4) {
      needsRecalc = true;
    }
  }

  // Recalculate positions once before settling any letters
  if (needsRecalc && !revealRecalced) {
    revealRecalced = true;
    calcPositions();
  }

  for (const pair of revealPairs) {
    if (pair.settled) continue;
    const alive = performance.now() - pair.born;
    if (alive > 800 && pair.body.speed < 0.4) {
      settleLetter(pair);
    }
  }

  // Sync swap debris
  for (const pair of debrisPairs) {
    const pos = pair.body.position;
    const ang = pair.body.angle * (180 / Math.PI);
    pair.el.style.transform = `translate(${pos.x - 17}px, ${pos.y - 12}px) rotate(${ang}deg)`;
  }

  // Sync sofia fall bodies
  const sfm = getLetterMetrics();
  for (const pair of sofiaFallPairs) {
    if (pair.settled) continue;
    const pos = pair.body.position;
    const ang = pair.body.angle * (180 / Math.PI);
    pair.el.style.transform = `translate(${pos.x - sfm.offsetX}px, ${pos.y - sfm.offsetY}px) rotate(${ang}deg)`;
  }

  // Overflow flush: 35+ swaps OR any debris touches the top of the frame
  if (!flushing && debrisPairs.length > 0) {
    const fr = frameWrap.getBoundingClientRect();
    const pad = fr.height * FLOOR_PAD_RATIO;
    const thick = 80;
    const inset = fr.width * 0.007;
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

        // Fade out sybil image overlay + border
        gsap.to(bgSybilEl, { opacity: 0, duration: 0.3, ease: 'power2.out', x: 0, overwrite: true });
        gsap.to(bgHoverEl, { clipPath: 'inset(0 100% 0 0)', duration: 0.4, ease: 'power2.out', overwrite: true });
        gsap.to(frameBorderEl, { opacity: 0, x: 0, duration: 0.4, ease: 'power2.out', overwrite: true });
        firstHoverDone = false;

        const m = getLetterMetrics();

        // Kill any in-flight swap tweens and hide ALL slot letters
        for (const slot of slots) {
          gsap.killTweensOf(slot.sofiaEl);
          gsap.killTweensOf(slot.sybilEl);
          gsap.set(slot.sofiaEl, { opacity: 0 });
          gsap.set(slot.sybilEl, { opacity: 0 });
        }

        // Remove the main floor immediately — debris falls through
        const floorBodies = world.bodies.filter(b => b.isStatic && b.label === 'wall');
        const mainFloor = floorBodies.find(b => b.position.y > fr.top + fr.height * 0.5);
        if (mainFloor) World.remove(world, mainFloor);

        // Add a private floor only sofia bodies can collide with
        const sofiaFloor = Bodies.rectangle(
          fr.left + fr.width / 2, fr.bottom - fr.height * FLOOR_PAD_RATIO - fr.width * 0.007 + 40, fr.width * 1.4, 80,
          { isStatic: true, label: 'sofiaFloor', restitution: 0.3, friction: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0004 } }
        );
        World.add(world, sofiaFloor);

        const sofiaLeftWall = Bodies.rectangle(
          fr.left + pad + inset - thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
          { isStatic: true, label: 'sofiaWall', restitution: 0.3, friction: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0004 } }
        );
        const sofiaRightWall = Bodies.rectangle(
          fr.right - pad - inset + thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
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
          const body = Bodies.rectangle(slot.x, slot.y - 20, m.letterW * 0.7, m.letterH * 0.65, {
            restitution: 0.4, friction: 0.8, frictionAir: 0.005,
            angle: (Math.random() - 0.5) * 0.3, density: 0.004, sleepThreshold: 300,
            collisionFilter: { category: 0x0004, mask: 0x0002 },
          });
          Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.8, y: 2 + Math.random() * 1.5 });
          World.add(world, body);
          sofiaFallPairs.push({ el: slot.sofiaEl, body, slot, born: performance.now() });
        }

        // Wait for sofia to settle, then clean up and rise
        const checkSettle = () => {
          const now = performance.now();
          const allSettled = sofiaFallPairs.every(p =>
            p.settled || (now - p.born > 500 && p.body.speed < 0.5)
          );
          if (!allSettled) { requestAnimationFrame(checkSettle); return; }

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
          World.remove(world, sofiaLeftWall);
          World.remove(world, sofiaRightWall);

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
            revealPairs.length = 0;
            settledCount = 0;
            revealStarted = false;

            calcPositions();
            const mRise = getLetterMetrics();

            for (const slot of slots) {
              gsap.set(slot.sybilEl, {
                x: slot.x - mRise.offsetX,
                y: slot.y - mRise.offsetY - (mRise.swapDist || 55),
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
                      revealComplete = true;
                      frameWrap.style.cursor = '';
                      flushing = false;
                    }
                  }
                }
              );
            });
          }, 400);
        };
        // Start checking after a minimum fall time
        setTimeout(checkSettle, 600);
    }
  }
});

/* ── Swap: new letter drops from top, old one becomes physics debris ── */
function swapTo(name) {
  if (name === currentName || flushing) return;
  // If this swap would trigger flush, just bump the count and bail —
  // flush will handle the visual transition, no need for swap debris
  if (swapCount + 1 >= 40) {
    swapCount++;
    return;
  }

  currentName = name;
  calcPositions();
  swapCount++;

  const swapSlots = slots;

  const m = getLetterMetrics();

  swapSlots.forEach((slot, idx) => {
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

    gsap.set(outEl, { opacity: 0, y: baseY - m.swapDist });

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
        x: (Math.random() - 0.5) * 2,
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

} // end if (!isMobile) — desktop physics

initPositions();

/* ── Cinematic reveal ── */

if (isMobile) {
  /* ═══════════════════════════════════════
     MOBILE: Matter.js physics swap (like desktop)
     ═══════════════════════════════════════ */

  const { Engine, World, Bodies, Body, Runner, Events } = Matter;
  const engine = Engine.create({
    gravity: { x: 0, y: 1.2 },
    enableSleeping: true,
    positionIterations: 8,
    velocityIterations: 6,
  });
  const world = engine.world;
  const runner = Runner.create();
  Runner.run(runner, engine);

  const debrisPairs = [];
  const sofiaFallPairs = [];
  let flushing = false;
  let swapCount = 0;
  let firstTapDone = false;

  const FLOOR_PAD_RATIO = 0.03;

  function buildWalls() {
    const oldStatic = world.bodies.filter(b => b.isStatic && b.label === 'wall');
    World.remove(world, oldStatic);

    const fr = frameWrap.getBoundingClientRect();
    const pad = fr.height * FLOOR_PAD_RATIO;
    const thick = 60;
    const inset = fr.width * 0.01;
    const wallFilter = { category: 0x0004, mask: 0xFFFF };

    // Floor
    World.add(world, Bodies.rectangle(
      fr.left + fr.width / 2, fr.bottom - pad - inset + thick / 2, fr.width * 1.4, thick,
      { isStatic: true, label: 'wall', restitution: 0.3, friction: 0.6, collisionFilter: wallFilter }
    ));
    // Left wall
    World.add(world, Bodies.rectangle(
      fr.left + pad + inset - thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
      { isStatic: true, label: 'wall', collisionFilter: wallFilter }
    ));
    // Right wall
    World.add(world, Bodies.rectangle(
      fr.right - pad - inset + thick / 2, fr.top + fr.height / 2, thick, fr.height * 2,
      { isStatic: true, label: 'wall', collisionFilter: wallFilter }
    ));
  }

  // ── Reveal: scale-up frame + border together + letter rain ──
  gsap.set(sceneEl, { opacity: 1 });
  gsap.set(frameWrap, { scale: 0.85, opacity: 0, y: 30 });

  const revealTL = gsap.timeline({ delay: 0.3 });
  revealTL.to(frameWrap, {
    scale: 1, opacity: 1, y: 0,
    duration: 1.4, ease: 'power2.out',
  });

  // Build walls + start letter rain after frame arrives
  revealTL.call(() => {
    calcPositions();
    buildWalls();
    startLetterRain();
  }, null, 1.2);

  /* ── Letter rain reveal (physics-based, like desktop) ── */
  const revealPairs = [];
  let settledCount = 0;

  function startLetterRain() {
    if (revealStarted) return;
    revealStarted = true;
    const m = getLetterMetrics();
    const fr = frameWrap.getBoundingClientRect();

    slots.forEach((slot, idx) => {
      const delay = idx * 45 + Math.random() * 30;

      setTimeout(() => {
        gsap.set(slot.sofiaEl, { opacity: 0.9 });

        const startX = slot.x + (Math.random() - 0.5) * 30;
        const startY = fr.top - 40 - Math.random() * 60;

        const body = Bodies.rectangle(startX, startY, m.letterW * 0.7, m.letterH * 0.65, {
          restitution: 0.3, friction: 0.5, frictionAir: 0.008,
          angle: (Math.random() - 0.5) * 0.4, density: 0.003, sleepThreshold: 60,
        });
        Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 1,
          y: 1.5 + Math.random() * 1,
        });
        World.add(world, body);

        revealPairs.push({ el: slot.sofiaEl, body, slot, settled: false, born: performance.now() });
      }, delay);
    });

    // Safety timeout
    setTimeout(() => {
      calcPositions();
      for (const pair of revealPairs) {
        if (!pair.settled) settleLetter(pair);
      }
    }, 4000);
  }

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
          if (settledCount >= slots.length) { revealComplete = true; startBreathe(); }
        }
      }
    );
  }

  /* ── Breathe pulse until first tap ── */
  let breatheTL = null;
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

  let revealRecalced = false;

  /* ── Swap on tap (like desktop swapTo) ── */
  function swapTo(name) {
    if (name === currentName || flushing) return;
    stopBreathe();
    if (swapCount + 1 >= 40) { swapCount++; return; }

    currentName = name;
    calcPositions();
    swapCount++;

    // First tap: crossfade bg photo
    if (!firstTapDone) {
      firstTapDone = true;
      gsap.to(bgSybilEl, { opacity: 1, duration: 0.6, delay: 0.1, ease: 'power2.inOut', overwrite: true });
    } else {
      // Toggle bg
      const showSybil = name === 'sybil';
      gsap.to(bgSybilEl, {
        opacity: showSybil ? 1 : 0,
        duration: 0.2, delay: 0, ease: 'power2.inOut', overwrite: true,
      });
    }

    const m = getLetterMetrics();

    slots.forEach((slot, idx) => {
      const outEl = name === 'sybil' ? slot.sofiaEl : slot.sybilEl;
      const inEl = name === 'sybil' ? slot.sybilEl : slot.sofiaEl;
      const baseY = slot.y - m.offsetY;
      const delay = idx * 0.03 + Math.random() * 0.04;

      // Kill tweens and snap outgoing to rest position
      gsap.killTweensOf(outEl);
      gsap.killTweensOf(inEl);
      // Snap outgoing to rest position, visible, so clone inherits correct state
      gsap.set(outEl, { x: slot.x - m.offsetX, y: baseY, rotation: slot.restRot, opacity: 0.9 });

      // Clone as debris — inherits rest position + opacity, seamlessly replaces outEl
      const debris = outEl.cloneNode(true);
      debris.style.pointerEvents = 'none';
      letterField.appendChild(debris);

      // Defer hide to next frame — gives debris clone time to render on mobile GPU
      requestAnimationFrame(() => {
        gsap.set(outEl, { opacity: 0, y: baseY - m.swapDist });
      });

      setTimeout(() => {
        const body = Bodies.rectangle(slot.x, slot.y, m.letterW * 0.7, m.letterH * 0.65, {
          restitution: 0.35, friction: 0.5, frictionAir: 0.01,
          angle: slot.restRot * Math.PI / 180, density: 0.002, sleepThreshold: 30,
        });
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.5, y: 0 });
        World.add(world, body);
        debrisPairs.push({ el: debris, body, born: performance.now() });
      }, delay * 1000);

      // New letter drops in
      gsap.fromTo(inEl,
        { x: slot.x - m.offsetX, y: baseY - m.swapDist, rotation: slot.restRot, opacity: 0 },
        { y: baseY, opacity: 0.9, duration: 0.4, delay: delay + 0.06, ease: 'power2.out', overwrite: true }
      );
    });
  }

  /* ── Physics sync loop ── */
  Events.on(engine, 'afterUpdate', () => {
    const m = getLetterMetrics();

    // Sync reveal letters
    let needsRecalc = false;
    for (const pair of revealPairs) {
      if (pair.settled) continue;
      const pos = pair.body.position;
      const ang = pair.body.angle * (180 / Math.PI);
      pair.el.style.transform = `translate(${pos.x - m.offsetX}px, ${pos.y - m.offsetY}px) rotate(${ang}deg)`;

      const alive = performance.now() - pair.born;
      if (alive > 800 && pair.body.speed < 0.4) needsRecalc = true;
    }

    if (needsRecalc && !revealRecalced) {
      revealRecalced = true;
      calcPositions();
    }

    for (const pair of revealPairs) {
      if (pair.settled) continue;
      const alive = performance.now() - pair.born;
      if (alive > 800 && pair.body.speed < 0.4) settleLetter(pair);
    }

    // Sync swap debris
    for (const pair of debrisPairs) {
      const pos = pair.body.position;
      const ang = pair.body.angle * (180 / Math.PI);
      pair.el.style.transform = `translate(${pos.x - m.offsetX}px, ${pos.y - m.offsetY}px) rotate(${ang}deg)`;
    }

    // Sync sofia fall bodies
    for (const pair of sofiaFallPairs) {
      if (pair.settled) continue;
      const pos = pair.body.position;
      const ang = pair.body.angle * (180 / Math.PI);
      pair.el.style.transform = `translate(${pos.x - m.offsetX}px, ${pos.y - m.offsetY}px) rotate(${ang}deg)`;
    }

    // ── Flush check: 40+ swaps or debris reaches top ──
    if (!flushing && debrisPairs.length > 0) {
      const fr = frameWrap.getBoundingClientRect();
      const pad = fr.height * FLOOR_PAD_RATIO;
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

        // Reset bg
        gsap.to(bgSybilEl, { opacity: 0, duration: 0.3, ease: 'power2.out', overwrite: true });
        firstTapDone = false;

        // Hide all slot letters
        for (const slot of slots) {
          gsap.killTweensOf(slot.sofiaEl);
          gsap.killTweensOf(slot.sybilEl);
          gsap.set(slot.sofiaEl, { opacity: 0 });
          gsap.set(slot.sybilEl, { opacity: 0 });
        }

        // Remove main floor — debris falls through
        const fr2 = frameWrap.getBoundingClientRect();
        const thick = 60;
        const inset = fr2.width * 0.01;
        const floorBodies = world.bodies.filter(b => b.isStatic && b.label === 'wall');
        const mainFloor = floorBodies.find(b => b.position.y > fr2.top + fr2.height * 0.5);
        if (mainFloor) World.remove(world, mainFloor);

        // Private floor + side walls for sofia re-rain
        const sofiaFloor = Bodies.rectangle(
          fr2.left + fr2.width / 2, fr2.bottom - fr2.height * FLOOR_PAD_RATIO - inset + 30, fr2.width * 1.4, thick,
          { isStatic: true, label: 'sofiaFloor', restitution: 0.3, friction: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0004 } }
        );
        const sofiaLeftWall = Bodies.rectangle(
          fr2.left + inset - thick / 2, fr2.top + fr2.height / 2, thick, fr2.height * 2,
          { isStatic: true, label: 'sofiaWall', restitution: 0.3, friction: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0004 } }
        );
        const sofiaRightWall = Bodies.rectangle(
          fr2.right - inset + thick / 2, fr2.top + fr2.height / 2, thick, fr2.height * 2,
          { isStatic: true, label: 'sofiaWall', restitution: 0.3, friction: 0.6,
            collisionFilter: { category: 0x0002, mask: 0x0004 } }
        );
        World.add(world, [sofiaFloor, sofiaLeftWall, sofiaRightWall]);

        // Wake debris, nudge down
        for (const dp of debrisPairs) {
          if (dp.body.isSleeping) Matter.Sleeping.set(dp.body, false);
          Body.setVelocity(dp.body, { x: dp.body.velocity.x, y: Math.max(dp.body.velocity.y, 3) });
        }

        // Sofia fall bodies
        for (const slot of slots) {
          gsap.set(slot.sofiaEl, { opacity: 0.9 });
          const body = Bodies.rectangle(slot.x, slot.y - 20, m.letterW * 0.7, m.letterH * 0.65, {
            restitution: 0.4, friction: 0.8, frictionAir: 0.005,
            angle: (Math.random() - 0.5) * 0.3, density: 0.004, sleepThreshold: 300,
            collisionFilter: { category: 0x0004, mask: 0x0002 },
          });
          Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.5, y: 1.5 + Math.random() * 1 });
          World.add(world, body);
          sofiaFallPairs.push({ el: slot.sofiaEl, body, slot, born: performance.now() });
        }

        // Wait for settle, then rise
        const checkSettle = () => {
          const now2 = performance.now();
          const allSettled = sofiaFallPairs.every(p =>
            p.settled || (now2 - p.born > 500 && p.body.speed < 0.5)
          );
          if (!allSettled) { requestAnimationFrame(checkSettle); return; }

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

          World.remove(world, sofiaFloor);

          // Clean up debris
          for (const dp of debrisPairs) {
            World.remove(world, dp.body);
            dp.el.remove();
          }
          debrisPairs.length = 0;
          swapCount = 0;

          // Pause, then rise
          setTimeout(() => {
            buildWalls();
            currentName = 'sofia';
            revealPairs.length = 0;
            settledCount = 0;
            revealStarted = false;
            revealRecalced = false;

            calcPositions();
            const mRise = getLetterMetrics();

            for (const slot of slots) {
              gsap.set(slot.sybilEl, {
                x: slot.x - mRise.offsetX,
                y: slot.y - mRise.offsetY - (mRise.swapDist || 30),
                rotation: slot.restRot, opacity: 0,
              });
            }

            // Rise from floor to home
            let completed = 0;
            sofiaFallPairs.forEach((pair, idx) => {
              gsap.fromTo(pair.el,
                { x: pair.capturedX, y: pair.capturedY, rotation: pair.capturedRot },
                {
                  x: pair.slot.x - mRise.offsetX,
                  y: pair.slot.y - mRise.offsetY,
                  rotation: pair.slot.restRot,
                  duration: 0.7, ease: 'power2.out',
                  delay: idx * 0.045 + Math.random() * 0.03,
                  onComplete: () => {
                    completed++;
                    if (completed >= sofiaFallPairs.length) {
                      sofiaFallPairs.length = 0;
                      revealComplete = true;
                      flushing = false;
                    }
                  }
                }
              );
            });
          }, 400);
        };
        setTimeout(checkSettle, 600);
      }
    }
  });

  // ── Tap/swipe/scroll anywhere to swap (except nav) ──
  let lastTapTime = 0;
  function handleTap(e) {
    if (!revealComplete) return;
    if (e.target.closest('.mob-sheet')) return;
    const now = Date.now();
    if (e.type === 'click' && now - lastTapTime < 500) return;
    if (e.type === 'touchend') lastTapTime = now;
    swapTo(currentName === 'sofia' ? 'sybil' : 'sofia');
  }
  document.addEventListener('touchend', handleTap);
  document.addEventListener('click', handleTap);

  // ── Mobile resize ──
  window.addEventListener('resize', () => {
    if (flushing) return;
    buildWalls();
    calcPositions();
    if (revealComplete) {
      const m = getLetterMetrics();
      for (const slot of slots) {
        slot.sofiaEl.style.height = m.letterH + 'px';
        slot.sybilEl.style.height = m.letterH + 'px';
        const activeEl = currentName === 'sofia' ? slot.sofiaEl : slot.sybilEl;
        gsap.set(activeEl, { x: slot.x - m.offsetX, y: slot.y - m.offsetY });
      }
    }
  });

} else {
  /* ═══════════════════════════════════════
     DESKTOP: Original cinematic reveal
     ═══════════════════════════════════════ */

  // Start state: frame small near the bottom of the scene
  gsap.set(sceneEl, { opacity: 1 });
  gsap.set(frameWrap, { scale: 0.18, transformOrigin: '50% 100%' });
  gsap.set(outerBorder, { opacity: 0 });

  const revealTL = gsap.timeline({ delay: 0.3 });

  // Scale up from small-at-bottom to full size at center
  revealTL.to(frameWrap, {
    scale: 1,
    duration: 2.2,
    ease: 'power2.out',
  });

  // Fade in the frame border as it arrives
  revealTL.to(outerBorder, {
    opacity: 1,
    duration: 0.8,
    ease: 'power2.out',
  }, '-=0.8');

  // Letter rain starts near the end of the scale-up
  revealTL.call(() => { startLetterRain(); }, null, 1.6);

}

/* ── Floating dust particles ── */
(function () {
  const canvas = document.getElementById('dustCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const NUM = isMobile ? 30 : 65;
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

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
