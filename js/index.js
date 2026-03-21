/* ── Refs ── */

const letterField = document.getElementById('letterField');
const frameWrap = document.getElementById('frameWrap');

/* ── State ── */
let currentName = 'sofia';
let revealComplete = false;
let revealStarted = false;

/* ── Hover triggers ── */
const bgHoverEl = document.getElementById('bgHover');
const frameBorderEl = document.getElementById('frameBorderHover');
const outerBorder = frameWrap.querySelector('.frame-border');

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

    // Border clock-sweep in
    sweepObj.progress = 0;
    sweepTween = gsap.to(sweepObj, {
      progress: 1,
      duration: 0.75,
      delay: 0.35,
      ease: 'power2.out',
      onUpdate: () => { frameBorderEl.style.clipPath = clockWipe(sweepObj.progress); }
    });
    gsap.to(frameBorderEl, { x: 20, duration: 0.4, delay: 0.35, ease: 'power4.in', overwrite: true });
  }

  // Letters swap every hover
  swapTo(currentName === 'sofia' ? 'sybil' : 'sofia');
}

frameWrap.addEventListener('mouseenter', hoverIn);

/* ── Slot-based letter swap with physics ── */
const sofiaChars = 'sofia cartuccia'.split('');
const sybilChars = 'sybil sometimes'.split('');

function getLetterMetrics() {
  const fw = frameWrap.getBoundingClientRect().width;
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
  const anchorY = rect.top + 10;
  const anchorX = rect.left + rect.width / 2;
  const totalW = 14 * m.letterW + m.spaceW;
  const startX = anchorX - totalW / 2;

  for (const slot of slots) {
    const i = slot.nameIndex;
    if (i < 5) {
      slot.x = startX + i * m.letterW + m.letterW / 2;
    } else {
      slot.x = startX + 5 * m.letterW + m.spaceW + (i - 6) * m.letterW + m.letterW / 2;
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

/* ── Matter.js physics world ── */
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
        sweepObj.progress = 1;
        gsap.to(sweepObj, {
          progress: 0, duration: 0.4, ease: 'power2.out',
          onUpdate: () => { frameBorderEl.style.clipPath = clockWipe(sweepObj.progress); }
        });
        gsap.to(frameBorderEl, { x: 0, duration: 0.4, ease: 'power2.out', overwrite: true });
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

            // Rise from floor to name position
            let completed = 0;
            for (const pair of sofiaFallPairs) {
              gsap.fromTo(pair.el,
                { x: pair.capturedX, y: pair.capturedY, rotation: pair.capturedRot },
                {
                  x: pair.slot.x - mRise.offsetX,
                  y: pair.slot.y - mRise.offsetY,
                  rotation: pair.slot.restRot,
                  duration: 0.7,
                  ease: 'power2.out',
                  delay: Math.random() * 0.15,
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
            }
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

initPositions();

/* ── Cinematic reveal: small from bottom, scale up to center ── */
const sceneEl = document.getElementById('scene');

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

  const NUM = 65;
  const particles = [];

  for (let i = 0; i < NUM; i++) {
    const warmth = Math.random();
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.4 + Math.random() * 1.25,           // radius 0.4-1.6px
      vx: (Math.random() - 0.5) * 0.15,        // very slow horizontal drift
      vy: -0.05 - Math.random() * 0.12,         // slow upward float (like heated dust)
      alpha: 0.08 + Math.random() * 0.18,       // subtle opacity
      // warm tones: mix between pale cream and warm amber
      cr: 200 + Math.floor(warmth * 55),         // 200-255
      cg: 180 + Math.floor(warmth * 40),         // 180-220
      cb: 150 + Math.floor(warmth * 30),          // 150-180
      drift: Math.random() * Math.PI * 2,        // phase for sinusoidal sway
      driftSpeed: 0.003 + Math.random() * 0.006,
      driftAmp: 0.2 + Math.random() * 0.4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      // irregular shape: 5-7 points with random radii
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

      // wrap around edges
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
      // smooth closed blob via midpoints between shape vertices
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

/* ── Resize ── */
window.addEventListener('resize', () => {
  if (!revealComplete) return; // during reveal, physics adapts via walls
  calcPositions();
  const m = getLetterMetrics();
  for (const slot of slots) {
    const activeEl = currentName === 'sofia' ? slot.sofiaEl : slot.sybilEl;
    gsap.set(activeEl, { x: slot.x - m.offsetX, y: slot.y - m.offsetY });
    const inactiveEl = currentName === 'sofia' ? slot.sybilEl : slot.sofiaEl;
    gsap.set(inactiveEl, { x: slot.x - m.offsetX, y: slot.y - m.offsetY - m.swapDist, opacity: 0 });
  }
});
