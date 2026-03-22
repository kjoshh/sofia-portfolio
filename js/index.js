/* ── Refs ── */

const letterField = document.getElementById('letterField');
const frameWrap = document.getElementById('frameWrap');

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
  gsap.to(sceneEl, { scale: 1.02, duration: 0.6, ease: 'power2.out', overwrite: true });
}

function hoverOut() {
  if (!revealComplete) return;
  gsap.to(sceneEl, { scale: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true });
}

if (!isMobile) {
  frameWrap.addEventListener('mouseenter', hoverIn);
  frameWrap.addEventListener('mouseleave', hoverOut);
}

/* ── Slot-based letter swap with physics ── */
const sofiaChars = 'sofia cartuccia'.split('');
const sybilChars = 'sybil sometimes'.split('');

function getLetterMetrics() {
  const fw = frameWrap.getBoundingClientRect().width;
  if (isMobile) {
    // Fixed sizing for full-screen mobile — scale gently with viewport
    const vw = window.innerWidth;
    const scale = vw / 375; // reference: iPhone width
    return {
      letterH: 30 * scale,
      letterW: 36 * scale,
      spaceW:  26 * scale,
      swapDist: 24 * scale,
      offsetX: 16 * scale,
      offsetY: 16 * scale,
    };
  }
  // Pure frame-ratio: at 650px frame width these produce the reference sizes
  return {
    letterH: fw * 0.03225,   // 46 / 650
    letterW: fw * 0.042,   // 43 / 650
    spaceW:  fw * 0.0525,   // 48 / 650
    swapDist: fw * 0.05,  // 55 / 650
    offsetX: fw * 0.02,     // 26 / 650
    offsetY: fw * 0.0225,   // 18 / 650
  };
}

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
  // On mobile (full-screen bg), place letters in the lower third
  const anchorY = isMobile ? window.innerHeight * 0.72 : rect.top + 10;
  const anchorX = isMobile ? window.innerWidth / 2 : rect.left + rect.width / 2;
  const totalW = 14 * m.letterW + m.spaceW;
  const startX = anchorX - totalW / 2;

  for (const slot of slots) {
    const i = slot.nameIndex;
    if (isMobile) {
      // Two lines: word 1 (indices 0-4) and word 2 (indices 6+)
      if (i < 5) {
        const word1W = 5 * m.letterW;
        const word1Start = anchorX - word1W / 2;
        slot.x = word1Start + i * m.letterW + m.letterW / 2;
        slot.y = anchorY;
      } else {
        const word2Len = 9; // "cartuccia" / "sometimes"
        const word2W = word2Len * m.letterW;
        const word2Start = anchorX - word2W / 2;
        slot.x = word2Start + (i - 6) * m.letterW + m.letterW / 2;
        slot.y = anchorY + m.letterH * 1.6;
      }
    } else {
      if (i < 5) {
        slot.x = startX + i * m.letterW + m.letterW / 2;
      } else {
        slot.x = startX + 5 * m.letterW + m.spaceW + (i - 6) * m.letterW + m.letterW / 2;
      }
      slot.y = anchorY;
    }
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
      // After reveal, snap to final positions
      gsap.set(slot.sofiaEl, {
        x: slot.x - m.offsetX,
        y: slot.y - m.offsetY,
        rotation: slot.restRot,
        opacity: 0.9
      });
    } else {
      // Before/during reveal: invisible, above viewport
      gsap.set(slot.sofiaEl, {
        x: slot.x - m.offsetX,
        y: -80,
        rotation: 0,
        opacity: 0
      });
    }
    gsap.set(slot.sybilEl, {
      x: slot.x - m.offsetX,
      y: slot.y - m.offsetY - (m.swapDist || 55),
      rotation: slot.restRot,
      opacity: 0
    });
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

const FLOOR_PAD_RATIO = 0.05;

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
    fr.right - pad - inset + thick / 2 + 12, fr.top + fr.height / 2, thick, fr.height * 2,
    { isStatic: true, label: 'wall', collisionFilter: wallFilter }
  ));
}
buildWalls();
window.addEventListener('resize', () => { buildWalls(); initPositions(); });

/* ── Letter rain reveal ── */
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

    let shouldFlush = swapCount >= 30;

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
          fr.right - pad - inset + thick / 2 + 12, fr.top + fr.height / 2, thick, fr.height * 2,
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
  if (swapCount + 1 >= 30) {
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
const sceneEl = document.getElementById('scene');

if (isMobile) {
  /* ═══════════════════════════════════════
     MOBILE: Drag-to-toggle scatter swap
     ═══════════════════════════════════════ */

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Precomputed letter reuse: sofia nameIndex → sybil nameIndex (and reverse)
  // S(0→0), O(1→7), I(3→3), T(9→10), I(13→11)
  const letterMatches = { 0: 0, 1: 7, 3: 3, 9: 10, 13: 11 };
  const letterMatchesReverse = { 0: 0, 7: 1, 3: 3, 10: 9, 11: 13 };

  // Slot lookup by nameIndex
  const slotByIndex = {};

  for (const s of slots) slotByIndex[s.nameIndex] = s;

  // ── Reveal: fade in frame + stagger letters ──
  gsap.set(sceneEl, { opacity: 1 });
  gsap.set(frameWrap, { scale: 1, y: 0 });
  gsap.set(outerBorder, { opacity: 0 });

  gsap.from(frameWrap, { opacity: 0, duration: 1.5, delay: 0.3, ease: 'power2.out' });

  const m0 = getLetterMetrics();
  slots.forEach((slot, idx) => {
    gsap.set(slot.sofiaEl, { x: slot.x - m0.offsetX, y: slot.y - m0.offsetY, opacity: 0 });
    gsap.set(slot.sybilEl, { x: slot.x - m0.offsetX, y: slot.y - m0.offsetY, opacity: 0 });
    gsap.to(slot.sofiaEl, {
      opacity: 0.9,
      duration: 0.6,
      delay: 0.8 + idx * 0.05,
      ease: 'back.out(1.7)',
      onComplete: () => {
        if (idx === slots.length - 1) revealComplete = true;
      }
    });
  });

  // ── Toggle state ──
  let showingSybil = false;
  let swapping = false;
  let dragging = false;
  let dragX = 0, dragY = 0;
  let dragStartX = null;
  let dragStartY = null;
  let pushedSlots = new Set(); // tracks which slots got pushed during this drag

  const PUSH_RADIUS = 55;   // how close finger needs to be to push a letter
  const PUSH_FORCE = 30;   // how far letters fly when pushed
  let DRAG_TRIGGER = Math.max(80, window.innerWidth * 0.28); // viewport-relative drag threshold

  // Per-slot push tracking
  for (const s of slots) {
    s.pushed = false;
    s.pushX = 0;
    s.pushY = 0;
    s.pushRot = 0;
  }

  // ── Push letters away from drag point ──
  function pushLettersFrom(px, py) {
    const m = getLetterMetrics();
    for (const slot of slots) {
      if (slot.pushed) continue;
      const activeEl = showingSybil ? slot.sybilEl : slot.sofiaEl;
      const dist = Math.hypot(px - slot.x, py - slot.y);

      if (dist < PUSH_RADIUS) {
        // Start measuring drag distance from first letter contact
        if (pushedSlots.size === 0) {
          dragStartX = px;
          dragStartY = py;
        }
        slot.pushed = true;
        pushedSlots.add(slot);

        // Push direction: away from finger, clean and directional
        const angle = Math.atan2(slot.y - py, slot.x - px);
        const force = PUSH_FORCE * (1 - dist / PUSH_RADIUS) + PUSH_FORCE * 0.5;
        slot.pushX = slot.x + Math.cos(angle) * force + (Math.random() - 0.5) * 15;
        slot.pushY = slot.y + Math.sin(angle) * force + (Math.random() - 0.5) * 15;
        slot.pushRot = (Math.random() - 0.5) * 12;

        gsap.to(activeEl, {
          x: slot.pushX - m.offsetX,
          y: slot.pushY - m.offsetY,
          rotation: slot.pushRot,
          scale: 0.85,
          opacity: 0.6,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: true,
        });

      }
    }

    // Trigger swap once finger has moved 50px from where it started
    if (dragStartX !== null && dragStartY !== null &&
        Math.hypot(px - dragStartX, py - dragStartY) >= 50 && !swapping) {
      dragging = false;
      reassembleAsNewName();
      resetPushState();
    }
  }

  // ── Reassemble into new name (called on drag end) ──
  function reassembleAsNewName() {
    swapping = true;
    const m = getLetterMetrics();
    const toSybil = !showingSybil;
    const matches = toSybil ? letterMatches : letterMatchesReverse;
    const claimedTargets = new Set(Object.values(matches));
    let completed = 0;
    const total = slots.length;

    function checkDone() {
      completed++;
      if (completed >= total) {
        swapping = false;
        // Reset all hidden elements to their home positions for next swap
        const m2 = getLetterMetrics();
        for (const s of slots) {
          const hiddenEl = toSybil ? s.sofiaEl : s.sybilEl;
          gsap.set(hiddenEl, {
            x: s.x - m2.offsetX,
            y: s.y - m2.offsetY,
            rotation: s.restRot,
            scale: 1,
            opacity: 0,
          });
        }
      }
    }

    slots.forEach((slot, idx) => {
      const outEl = toSybil ? slot.sofiaEl : slot.sybilEl;
      const inEl = toSybil ? slot.sybilEl : slot.sofiaEl;
      const srcIdx = slot.nameIndex;
      const matchTarget = matches[srcIdx];

      const scatterX = slot.pushed ? slot.pushX : slot.x + (Math.random() - 0.5) * vw * 0.5;
      const scatterY = slot.pushed ? slot.pushY : slot.y + (Math.random() - 0.5) * vh * 0.3;
      const scatterRot = slot.pushed ? slot.pushRot : (Math.random() - 0.5) * 120;

      if (matchTarget !== undefined) {
        // MATCHED: same letter in both names — fly to new position
        const targetSlot = slotByIndex[matchTarget];
        const targetInEl = toSybil ? targetSlot.sybilEl : targetSlot.sofiaEl;

        // 1) Fly outEl to target slot's home position
        gsap.to(outEl, {
          x: targetSlot.x - m.offsetX,
          y: targetSlot.y - m.offsetY,
          rotation: targetSlot.restRot,
          scale: 1,
          opacity: 0.9,
          duration: 0.5,
          delay: 0.1 + idx * 0.03,
          ease: 'back.out(1.4)',
          overwrite: true,
          onComplete: () => {
            // Invisible swap: hide old, show TARGET slot's inEl
            gsap.set(outEl, { opacity: 0 });
            gsap.set(targetInEl, {
              x: targetSlot.x - m.offsetX,
              y: targetSlot.y - m.offsetY,
              rotation: targetSlot.restRot,
              scale: 1,
              opacity: 0.9,
            });
            checkDone();
          }
        });

        // 2) Source slot's own inEl needs unmatched treatment
        //    (unless source == target, like S(0→0) and I(3→3))
        if (matchTarget !== srcIdx) {
          gsap.set(inEl, {
            x: scatterX - m.offsetX,
            y: scatterY - m.offsetY,
            rotation: scatterRot,
            scale: 0.5,
            opacity: 0,
          });
          const returnDelay = 0.25 + idx * 0.03 + Math.random() * 0.08;
          gsap.to(inEl, {
            x: slot.x - m.offsetX,
            y: slot.y - m.offsetY,
            rotation: slot.restRot,
            scale: 1,
            opacity: 0.9,
            duration: 0.5,
            delay: returnDelay,
            ease: 'back.out(1.4)',
            overwrite: true,
          });
        }

      } else if (claimedTargets.has(srcIdx)) {
        // This slot's target position is claimed by a matched letter flying in
        // Drift outgoing letter away and fade
        gsap.to(outEl, {
          x: scatterX - m.offsetX + (Math.random() - 0.5) * 40,
          y: scatterY - m.offsetY - 30,
          opacity: 0,
          scale: 0.3,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
          onComplete: checkDone,
        });
        // inEl at this slot will be positioned by the matched letter's onComplete

      } else {
        // UNMATCHED: crossfade at scattered position, then fly home
        gsap.to(outEl, {
          x: scatterX - m.offsetX + (Math.random() - 0.5) * 40,
          y: scatterY - m.offsetY - 30,
          opacity: 0,
          scale: 0.3,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });

        gsap.set(inEl, {
          x: scatterX - m.offsetX,
          y: scatterY - m.offsetY,
          rotation: scatterRot,
          scale: 0.5,
          opacity: 0,
        });

        const returnDelay = 0.25 + idx * 0.03 + Math.random() * 0.08;
        gsap.to(inEl, {
          x: slot.x - m.offsetX,
          y: slot.y - m.offsetY,
          rotation: slot.restRot,
          scale: 1,
          opacity: 0.9,
          duration: 0.5,
          delay: returnDelay,
          ease: 'back.out(1.4)',
          overwrite: true,
          onComplete: checkDone,
        });
      }
    });

    // Crossfade background
    gsap.to(bgSybilEl, {
      opacity: toSybil ? 1 : 0,
      duration: 0.8,
      delay: 0.1,
      ease: 'power2.inOut',
      overwrite: true,
    });

    showingSybil = toSybil;
  }

  // ── Snap un-pushed letters back to rest (called when drag doesn't trigger swap) ──
  function snapBack() {
    const m = getLetterMetrics();
    for (const slot of slots) {
      if (!slot.pushed) continue;
      const activeEl = showingSybil ? slot.sybilEl : slot.sofiaEl;
      gsap.to(activeEl, {
        x: slot.x - m.offsetX,
        y: slot.y - m.offsetY,
        rotation: slot.restRot,
        scale: 1,
        opacity: 0.9,
        duration: 0.4,
        ease: 'back.out(1.7)',
        overwrite: true,
      });
    }
  }

  // ── Reset push state ──
  function resetPushState() {
    for (const s of slots) {
      s.pushed = false;
      s.pushX = 0;
      s.pushY = 0;
      s.pushRot = 0;
    }
    pushedSlots.clear();
  }

  // ── End drag: snap back if swap didn't auto-trigger ──
  function endDrag() {
    if (!dragging && !pushedSlots.size) return;
    dragging = false;

    if (pushedSlots.size > 0 && !swapping) {
      // Not enough pushed to auto-trigger — snap back
      snapBack();
    } else if (!swapping) {
      snapBack();
    }
    resetPushState();
    dragStartX = null;
    dragStartY = null;
  }

  // ── Touch handlers ──
  letterField.addEventListener('touchstart', (e) => {
    if (swapping) return;
    e.preventDefault();
    dragging = true;
    const t = e.touches[0];
    dragX = t.clientX;
    dragY = t.clientY;
    dragStartX = null;
    dragStartY = null;
    resetPushState();
  }, { passive: false });

  letterField.addEventListener('touchmove', (e) => {
    if (!dragging || swapping) return;
    e.preventDefault();
    const t = e.touches[0];
    dragX = t.clientX;
    dragY = t.clientY;
    pushLettersFrom(dragX, dragY);
  }, { passive: false });

  letterField.addEventListener('touchend', () => {
    endDrag();
  });

  // ── Mouse handlers (for desktop emulation) ──
  let mouseDown = false;

  letterField.addEventListener('mousedown', (e) => {
    if (swapping) return;
    mouseDown = true;
    dragging = true;
    dragX = e.clientX;
    dragY = e.clientY;
    dragStartX = null;
    dragStartY = null;
    resetPushState();
  });

  document.addEventListener('mousemove', (e) => {
    if (!mouseDown || !dragging || swapping) return;
    dragX = e.clientX;
    dragY = e.clientY;
    pushLettersFrom(dragX, dragY);
  });

  document.addEventListener('mouseup', () => {
    if (!mouseDown) return;
    mouseDown = false;
    endDrag();
  });

  // ── Mobile resize ──
  window.addEventListener('resize', () => {
    if (swapping) return;
    DRAG_TRIGGER = Math.max(80, window.innerWidth * 0.28);
    calcPositions();
    const m = getLetterMetrics();
    for (const slot of slots) {
      const activeEl = showingSybil ? slot.sybilEl : slot.sofiaEl;
      const inactiveEl = showingSybil ? slot.sofiaEl : slot.sybilEl;
      gsap.set(activeEl, { x: slot.x - m.offsetX, y: slot.y - m.offsetY });
      gsap.set(inactiveEl, { opacity: 0 });
    }
  });

} else {
  /* ═══════════════════════════════════════
     DESKTOP: Original cinematic reveal
     ═══════════════════════════════════════ */

  // Start state: frame small near the bottom of the scene
  gsap.set(sceneEl, { opacity: 1 });
  gsap.set(frameWrap, { scale: 0.18, y: '38vh', transformOrigin: '50% 100%' });
  gsap.set(outerBorder, { opacity: 0 });

  const revealTL = gsap.timeline({ delay: 0.3 });

  // Scale up from small-at-bottom to full size at center
  revealTL.to(frameWrap, {
    scale: 1,
    y: 0,
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

  /* ── Desktop resize ── */
  window.addEventListener('resize', () => {
    if (!revealComplete) return;
    calcPositions();
    const m = getLetterMetrics();
    for (const slot of slots) {
      const activeEl = currentName === 'sofia' ? slot.sofiaEl : slot.sybilEl;
      gsap.set(activeEl, { x: slot.x - m.offsetX, y: slot.y - m.offsetY });
      const inactiveEl = currentName === 'sofia' ? slot.sybilEl : slot.sofiaEl;
      gsap.set(inactiveEl, { x: slot.x - m.offsetX, y: slot.y - m.offsetY - m.swapDist, opacity: 0 });
    }
  });
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
