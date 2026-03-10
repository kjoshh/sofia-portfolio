// ── Nav cursor follow + magnetic pull ──
const nav = document.querySelector('.main-nav');

// GSAP owns the transform — base centering via xPercent/yPercent
gsap.set(nav, { xPercent: -50, yPercent: 0 });

const navMoveX = gsap.quickTo(nav, 'x', { duration: 0.9, ease: 'power3.out' });
const navMoveY = gsap.quickTo(nav, 'y', { duration: 0.9, ease: 'power3.out' });

const PARALLAX_STRENGTH = 12.5;

window.addEventListener('mousemove', e => {
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  navMoveX((e.clientX - cx) / cx * PARALLAX_STRENGTH);
  navMoveY((e.clientY - cy) / cy * PARALLAX_STRENGTH);
});


// ── Nav hover — Fluid WebGL background transition ──
const NAV_BG = {
  'index.html': 'images/0017_17A.jpg',
  'projects.html': 'images/Forgettingdreams-1.jpg',
  'forgetting-dreams.html': 'images/Forgettingdreams-1.jpg',
  'archive.html': 'images/sofia_archive-31.jpg',
  'about.html': 'images/Sybilbg.jpg',
};

const defaultBg = document.querySelector('.imgbg');
const defaultImg = defaultBg ? defaultBg.querySelector('img') : null;

const noiseLayers = [
  { el: document.querySelector('.dusti'), peak: 0.7, rest: 0.1 },
  { el: document.querySelector('.nois3'), peak: 0.5, rest: 0.1 },
  { el: document.querySelector('.nois3-grain'), peak: 0.6, rest: 0.08 },
].filter(l => l.el);

// ==========================================
// FLUID HOVER CONFIGURATION
// Adjust these values to change the animation
// ==========================================
const FLUID_CONFIG = {
  // Animation duration in seconds (How long the wipe takes)
  duration: 6,

  // Power of the easing curve ('linear', 'power1.inOut', 'power2.inOut', 'power3.inOut', etc)
  ease: 'power2.out',

  // Speed of the organic noise movement while hovering
  noiseSpeed: 0.15,

  // Scale of the noise (Higher = smaller ripples; Lower = larger waves)
  noiseScale: 2.5,

  // How much the noise distorts the straight edge (Higher = messier edge)
  noiseAmount: 0.25,

  // How soft/harsh the masked wipe edge is (Lower = harsher line; Higher = softer gradient)
  edgeSoftness: 0.015,

  // --- Realism Settings ---
  // Strength of uneven growth tendrils (0 to 1)
  viscosity: 0.75,

  // Amount of lens distortion/warp purely at the edge of the fluid (0 to 0.1)
  refraction: 0.25, // Increased for a stronger, more concentrated effect

  // Brightness of the surface tension highlight at the edge (0 to 1)
  lipBrightness: 0.05,
  
  // --- Continuous Background Mouse Trail ---
  // Size of the background mouse distortion
  trailRadius: 0.15,
  
  // How strongly the trailing mouse warps the background photo
  trailIntensity: 0.05
};

// WebGL shaders for fluid ink spilled-over effect
const vertexShader = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;
const fragmentShader = `
  precision highp float;
  uniform sampler2D u_tex0;
  uniform sampler2D u_tex1;
  uniform float u_progress;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_aspect0;
  uniform vec2 u_aspect1;
  uniform float u_noiseSpeed;
  uniform float u_noiseScale;
  uniform float u_noiseAmount;
  uniform float u_edgeSoftness;
  uniform vec2 u_mouse;
  uniform float u_viscosity;
  uniform float u_refraction;
  uniform float u_lipBrightness;
  uniform vec2 u_mouseTrailing;
  uniform float u_trailRadius;
  uniform float u_trailIntensity;

  varying vec2 v_uv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i+vec2(0,0)),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
  }
  float turbulence(vec2 p) {
    float t = 0.0; float w = 0.5;
    for (int i = 0; i < 5; i++) { t += abs(noise(p)) * w; p *= 2.0; w *= 0.5; }
    return t;
  }
  vec2 getCoverUV(vec2 uv, vec2 res, vec2 aspect) {
    float screenR = res.x / res.y;
    float imgR = aspect.x / aspect.y;
    vec2 newUv = uv;
    if (imgR > screenR) {
      newUv.x = 0.5 + (uv.x - 0.5) * (screenR / imgR);
    } else {
      newUv.y = 0.5 + (uv.y - 0.5) * (imgR / screenR);
    }
    return newUv;
  }

  void main() {
    vec2 uv = v_uv;
    
    // Correct positions for screen aspect ratio
    float screenR = u_resolution.x / u_resolution.y;
    vec2 correctedUV = uv;
    correctedUV.x *= screenR;
    vec2 correctedMouseTrailing = u_mouseTrailing;
    correctedMouseTrailing.x *= screenR;

    // === Mouse Trail Warp ===
    // Compute offset BEFORE sampling textures so it can be applied to all UVs.
    // The offset is strictly 0 outside the radius — no blending seam possible.
    // We use cheap 2-octave noise here (not full turbulence) to keep performance light.
    float trailDist = distance(correctedUV, correctedMouseTrailing);
    float trailFalloff = 1.0 - clamp(trailDist / u_trailRadius, 0.0, 1.0);
    float trailStrength = trailFalloff * trailFalloff * trailFalloff; // cubic, very soft
    // Cheap 2-octave noise (no turbulence loop needed)
    float tw1 = noise(correctedUV * 4.0 - u_time * 0.5);
    float tw2 = noise(correctedUV * 8.0 + u_time * 0.3);
    float trailWobble = (tw1 * 0.7 + tw2 * 0.3) - 0.5;
    vec2 trailNorm = normalize(correctedUV - correctedMouseTrailing + vec2(0.0001, 0.0001));
    vec2 trailOffset = trailNorm * trailWobble * u_trailIntensity * trailStrength;

    // Sample textures with the trail warp baked in
    vec2 uv0 = getCoverUV(uv + trailOffset, u_resolution, u_aspect0);
    vec4 c0 = texture2D(u_tex0, uv0);

    vec2 uv1 = getCoverUV(uv + trailOffset, u_resolution, u_aspect1);
    vec4 c1 = texture2D(u_tex1, uv1);

    // Turbulent noise to distort the mask edge
    float n1 = turbulence(uv * u_noiseScale + u_time * u_noiseSpeed);
    float n2 = turbulence(uv * (u_noiseScale * 2.0) - u_time * (u_noiseSpeed * 1.3));
    float noiseComb = (n1 * 0.6 + n2 * 0.4);

    // Re-use already-computed correctedUV; correct u_mouse too
    vec2 correctedMouse = u_mouse;
    correctedMouse.x *= screenR;

    // Distance from the locked hover point
    float dist = distance(correctedUV, correctedMouse);
    
    // 1. Viscous Fingering: multiply progress by noise to make expansion uneven
    // Low frequency noise for "blobs"
    float fingerNoise = turbulence(correctedUV * 1.5 + u_time * 0.1);
    float progressMult = 1.0 + (fingerNoise - 0.5) * u_viscosity;
    
    // Add original noise to break down the perfect circle.
    float spread = dist + (noiseComb - 0.5) * u_noiseAmount;

    // Calculate max distance from the mouse to the screen corners
    // This ensures the animation time is perfectly consistent on all screen sizes and hover positions
    float d1 = distance(correctedMouse, vec2(0.0, 0.0));
    float d2 = distance(correctedMouse, vec2(screenR, 0.0));
    float d3 = distance(correctedMouse, vec2(0.0, 1.0));
    float d4 = distance(correctedMouse, vec2(screenR, 1.0));
    float maxDist = max(max(d1, d2), max(d3, d4));

    // Calculate start and end values for the progress mapping
    float minMult = 1.0 - (0.5 * u_viscosity);
    float pEnd = (maxDist + (u_noiseAmount * 0.5) + u_edgeSoftness) / minMult;
    
    // We adjust pStart to be just barely negative enough to hide noise,
    // ensuring the reveal starts expanding instantly to prevent "dead air" delay.
    float pStart = -(u_noiseAmount * 0.5 + u_edgeSoftness + 0.01) / minMult;
    
    // Base mapped progress
    float baseP = mix(pStart, pEnd, u_progress);
    
    // Apply viscous fingering
    float p = baseP * progressMult;
    
    // Mask logic
    float mask = smoothstep(p - u_edgeSoftness, p + u_edgeSoftness, spread);

    // 2. Refraction: warp the texture strictly at the edge of the reveal
    // We isolate the edge by multiplying the inverted mask by a tight inner bounds
    // This creates a "ring" of distortion just inside the fluid boundary.
    float edgeThickness = 0.08;
    float edgeRing = (1.0 - mask) * smoothstep(p - edgeThickness, p, spread);
    
    vec2 refractOff = vec2((noiseComb - 0.5) * u_refraction * edgeRing);
    vec2 uv1_refr = getCoverUV(uv + refractOff, u_resolution, u_aspect1);
    c1 = texture2D(u_tex1, uv1_refr);

    // 3. Surface Tension "Lip": Highlight the leading edge
    // A narrow ring right at the reveal front
    float lip = smoothstep(p + 0.01, p, spread) * smoothstep(p - 0.05, p - 0.02, spread);
    c1.rgb += lip * u_lipBrightness;

    vec4 finalColor = mix(c1, c0, mask);

    gl_FragColor = finalColor;
  }
`;

let scene, camera, renderer, uniforms;
const textures = {};
const textureAspects = {}; // Store dimensions to ensure consistent aspect ratios
const loader = new THREE.TextureLoader();
let bgCurrentSrc = NAV_BG['index.html'];
let bgNextSrc = bgCurrentSrc; // Initialize next to current to avoid null aspect jumps

function updateUniformAspects(src, uniformTarget) {
  if (uniforms && textureAspects[src]) {
    const { w, h } = textureAspects[src];
    if (uniformTarget === 0) uniforms.u_aspect0.value.set(w, h);
    if (uniformTarget === 1) uniforms.u_aspect1.value.set(w, h);
  }
}

// Load textures and trigger aspect ratio updates
Object.entries(NAV_BG).forEach(([key, src]) => {
  textures[src] = loader.load(src, tex => {
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // Store dimensions permanently
    textureAspects[src] = { w: tex.image.width, h: tex.image.height };

    // If this is the current or upcoming image, update the shader immediately
    if (uniforms) {
      if (bgCurrentSrc === src) {
        uniforms.u_tex0.value = tex;
        updateUniformAspects(src, 0);
      }
      if (bgNextSrc === src) {
        uniforms.u_tex1.value = tex;
        updateUniformAspects(src, 1);
      }

      // If we just loaded the current background image, render it so the screen isn't black
      if (bgCurrentSrc === src) {
        if (!isAnimating && typeof renderer !== 'undefined') {
          renderer.render(scene, camera);
        }
      }
    }
  });
});

const defaultTex = textures[bgCurrentSrc];

scene = new THREE.Scene();
camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
uniforms = {
  u_tex0: { value: defaultTex },
  u_tex1: { value: defaultTex },
  u_progress: { value: 0 },
  u_time: { value: 0 },
  u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  u_aspect0: { value: new THREE.Vector2(1, 1) },
  u_aspect1: { value: new THREE.Vector2(1, 1) },
  u_noiseSpeed: { value: FLUID_CONFIG.noiseSpeed },
  u_noiseScale: { value: FLUID_CONFIG.noiseScale },
  u_noiseAmount: { value: FLUID_CONFIG.noiseAmount },
  u_edgeSoftness: { value: FLUID_CONFIG.edgeSoftness },
  u_mouse: { value: new THREE.Vector2(0.5, 0.5) }, // Locked origin for transitions
  u_mouseTrailing: { value: new THREE.Vector2(0.5, 0.5) }, // Continuously lerped mouse for the trail
  u_trailRadius: { value: FLUID_CONFIG.trailRadius },
  u_trailIntensity: { value: FLUID_CONFIG.trailIntensity },
  u_viscosity: { value: FLUID_CONFIG.viscosity },
  u_refraction: { value: FLUID_CONFIG.refraction },
  u_lipBrightness: { value: FLUID_CONFIG.lipBrightness }
};

const mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
);
scene.add(mesh);

renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.inset = '0';
renderer.domElement.style.zIndex = '0';

if (defaultBg) {
  defaultBg.appendChild(renderer.domElement);
  if (defaultImg) defaultImg.style.display = 'none';
}

let isAnimating = false;
let animationFrameId = null;

// Track real mouse and interpolated "liquid" mouse
const targetMouse = new THREE.Vector2(0.5, 0.5);
const lerpedMouse = new THREE.Vector2(0.5, 0.5);

let _rafId = null;
let _idleTimer = null;

function stopRender() {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
}

function startRender() {
  if (_rafId) return; // already running
  _rafId = requestAnimationFrame(renderLoop);
}

function renderLoop() {
  uniforms.u_time.value += 0.01;
  // Smoothly lerp the continuous mouse toward the target (liquid drag feel)
  lerpedMouse.lerp(targetMouse, 0.1);
  uniforms.u_mouseTrailing.value.copy(lerpedMouse);
  renderer.render(scene, camera);
  _rafId = requestAnimationFrame(renderLoop);
}

// Render loop is now constant, instead of only running during transitions
startRender();

window.addEventListener('mousemove', (e) => {
  if (uniforms) {
    targetMouse.x = e.clientX / window.innerWidth;
    targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
  }
  // Resume rendering on mouse move; schedule idle stop
  startRender();
  clearTimeout(_idleTimer);
  // Pause the render loop 1.5s after the mouse stops (saves GPU/battery at rest)
  _idleTimer = setTimeout(() => {
    if (!isAnimating) stopRender();
  }, 1500);
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

// Helper removed in favor of textureAspects map

function slideBg(src) {
  if (src === bgCurrentSrc) return;

  bgNextSrc = src;
  const tex0 = textures[bgCurrentSrc];
  const tex1 = textures[src];

  uniforms.u_tex0.value = tex0;
  updateUniformAspects(bgCurrentSrc, 0);

  uniforms.u_tex1.value = tex1;
  updateUniformAspects(src, 1);

  bgCurrentSrc = src;

  gsap.killTweensOf(uniforms.u_progress);
  uniforms.u_progress.value = 0;

  // Start transition physics
  if (!isAnimating) {
    isAnimating = true;
  }

  gsap.to(uniforms.u_progress, {
    value: 1,
    duration: FLUID_CONFIG.duration,
    ease: FLUID_CONFIG.ease,
    onComplete: () => {
      // Flag transition as complete
      isAnimating = false;
    }
  });
}

const navHoverEls = [
  ...document.querySelectorAll('.main-nav .nav-link:not(.nav-dropdown-item)'),
  document.querySelector('.logo-link')
].filter(Boolean);

function setNavActive(activeEl) {
  navHoverEls.forEach(el => {
    if (el === activeEl) {
      el.classList.add('active');
      el.classList.remove('notactive');
    } else {
      const wasActive = el.classList.contains('active');
      el.classList.remove('active');
      el.classList.add('notactive');
      if (wasActive && el._staggerOff) el._staggerOff();
    }
  });
}

// Radial fluid expansion is triggered only on entry and locks in place.
navHoverEls.forEach(el => {
  const href = (el.getAttribute('href') || '').split('/').pop() || 'index.html';
  const src = NAV_BG[href];
  if (!src) return;
  el.addEventListener('mouseenter', (e) => {
    // Lock mouse position at the exact moment hover starts
    if (uniforms) {
      uniforms.u_mouse.value.x = e.clientX / window.innerWidth;
      uniforms.u_mouse.value.y = 1.0 - (e.clientY / window.innerHeight);
    }

    slideBg(src);
    setNavActive(el);
  });
});


// ── Logo text swap on hover (char stagger) ──
const logoEl = document.querySelector('.main-nav .logo-link');

if (logoEl) {
  const LOGO_DEFAULT = 'Sofia Cartuccia';
  const LOGO_SYBIL = 'Sybil Sometimes';

  function swapLogoChars(newText) {
    const wrappers = logoEl.querySelectorAll('.char-wrapper');
    const chars = [...newText].map(ch => ch === ' ' ? '\u00A0' : ch);

    wrappers.forEach((wrapper, i) => {
      const topSpan = wrapper.querySelector('.char-top');
      const bottomSpan = wrapper.querySelector('.char-bottom');
      const isHover = newText === LOGO_SYBIL;

      if (isHover) {
        // Going to Sybil - update bottom text before sliding up
        bottomSpan.textContent = chars[i] ?? '';
      } else {
        // Returning to Sofia - original text was already in topSpan.
        // The slide down will reveal it.
      }

      gsap.killTweensOf([topSpan, bottomSpan]);

      const yVal = isHover ? -100 : 0;

      gsap.to([topSpan, bottomSpan], {
        yPercent: yVal,
        duration: 0.4,
        delay: i * 0.03,
        ease: 'power3.inOut'
      });
    });
  }

  // "Sofia Cartuccia" is always low opacity — only "Sybil Sometimes" gets full opacity
  logoEl.classList.remove('active');
  logoEl.classList.add('notactive');

  // Restore "Sofia Cartuccia" at low opacity when another link becomes active
  logoEl._staggerOff = () => swapLogoChars(LOGO_DEFAULT);

  logoEl.addEventListener('mouseenter', () => swapLogoChars(LOGO_SYBIL));
}


// ── Fluid Nav Bar Wobble ──
(function () {
  const indexNav = document.querySelector('.index-nav');
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
    curTime += 0.015; // Animation speed
    const s = curTime * 1.5;

    // The base border-radius is ~40px (updated from 20px). 
    // We add noise to each corner to organically squash and stretch it.
    const r = (i) => Math.round(40 + (cnoise(s + i * 5.1, i * 4.2) - 0.5) * 16);

    navBg.style.borderRadius = `${r(0)}px ${r(1)}px ${r(2)}px ${r(3)}px / ${r(4)}px ${r(5)}px ${r(6)}px ${r(7)}px`;
    requestAnimationFrame(loop);
  })();
})();
