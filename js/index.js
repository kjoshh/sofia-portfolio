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
    vec2 uv0 = getCoverUV(uv, u_resolution, u_aspect0);
    vec4 c0 = texture2D(u_tex0, uv0);

    vec2 uv1 = getCoverUV(uv, u_resolution, u_aspect1);
    vec4 c1 = texture2D(u_tex1, uv1);

    // Turbulent noise to distort the mask edge - make it rougher
    float n1 = turbulence(uv * 4.0 + u_time * 0.3);
    float n2 = turbulence(uv * 8.0 - u_time * 0.4);
    float noiseComb = (n1 * 0.6 + n2 * 0.4);
    
    // Base shape is a bottom-to-top wipe: distance from bottom edge
    // Inverse uv.y so 0 is top and 1 is bottom
    float wipe = 1.0 - uv.y; 

    // Add a slight curvature so the center flows slightly ahead (optional but organic)
    float curve = sin(uv.x * 3.1415) * 0.2; 
    
    // Combine shape and noise. The noise breaks up the edge
    float spread = wipe - curve + (noiseComb - 0.5) * 0.8;

    // Expand u_progress beyond the 0..1 bounds to fully cover the noisy range
    float p = u_progress * 2.5 - 0.5;
    
    // Mask logic: harsher edge by narrowing the smoothstep range
    // When p is highly positive, mask -> 0 (c1 visible).
    float mask = smoothstep(p - 0.05, p + 0.05, spread);

    gl_FragColor = mix(c1, c0, mask);
  }
`;

let scene, camera, renderer, uniforms;
const textures = {};
const loader = new THREE.TextureLoader();
let bgCurrentSrc = NAV_BG['index.html'];

// Load textures and trigger aspect ratio updates
Object.entries(NAV_BG).forEach(([key, src]) => {
  textures[src] = loader.load(src, tex => {
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    // Nudge aspect ratio calculation when texture finishes loading
    if (bgCurrentSrc === src && uniforms) {
      uniforms.u_aspect0.value.set(tex.image.width, tex.image.height);
      uniforms.u_aspect1.value.set(tex.image.width, tex.image.height);
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
  u_aspect1: { value: new THREE.Vector2(1, 1) }
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

function animate() {
  requestAnimationFrame(animate);
  uniforms.u_time.value += 0.01;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

function getAspect(tex) {
  if (tex && tex.image && tex.image.width) return new THREE.Vector2(tex.image.width, tex.image.height);
  return new THREE.Vector2(1, 1);
}

function slideBg(src) {
  if (src === bgCurrentSrc) return;

  const tex0 = textures[bgCurrentSrc];
  const tex1 = textures[src];

  uniforms.u_tex0.value = tex0;
  uniforms.u_aspect0.value.copy(getAspect(tex0));

  uniforms.u_tex1.value = tex1;
  uniforms.u_aspect1.value.copy(getAspect(tex1));

  bgCurrentSrc = src;

  gsap.killTweensOf(uniforms.u_progress);
  uniforms.u_progress.value = 0;
  gsap.to(uniforms.u_progress, { value: 1, duration: 1.4, ease: 'power2.inOut' });

  // Pulse noise/grain overlays during fluid spill
  noiseLayers.forEach(({ el, peak, rest }) => {
    gsap.killTweensOf(el);
    gsap.to(el, { opacity: peak, duration: 0.6, ease: 'power4.in' });
    gsap.to(el, { opacity: rest, duration: 0.6, ease: 'power4.out', delay: 0.6 });
  });
}

const navHoverEls = [
  ...document.querySelectorAll('.main-nav .nav-link:not(.nav-dropdown-item)'),
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

navHoverEls.forEach(el => {
  const href = (el.getAttribute('href') || '').split('/').pop() || 'index.html';
  const src = NAV_BG[href];
  if (!src) return;
  el.addEventListener('mouseenter', () => {
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
    const spans = logoEl.querySelectorAll('.layout-nav-char');
    const chars = [...newText].map(ch => ch === ' ' ? '\u00A0' : ch);
    spans.forEach((span, i) => {
      gsap.killTweensOf(span);
      gsap.to(span, {
        opacity: 0, y: -6, duration: 0.2, delay: i * 0.03, ease: 'power2.in',
        onComplete() {
          span.textContent = chars[i] ?? '';
          gsap.fromTo(span, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power4.out' });
        }
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


// ── Projects dropdown ──
const dropdownWrap = document.querySelector('.nav-dropdown-wrap');
const dropdown = document.getElementById('projects-dropdown');
const dropdownItems = dropdown ? [...dropdown.querySelectorAll('.nav-dropdown-item')] : [];

if (dropdownWrap && dropdown) {
  // Align dropdown items with the Projects link
  function alignDropdown() {
    const projectsRect = dropdownWrap.getBoundingClientRect();
    const wrapinRect = dropdownWrap.closest('.wrapin').getBoundingClientRect();
    dropdown.style.paddingLeft = (projectsRect.left - wrapinRect.left) + 'px';
  }
  alignDropdown();
  window.addEventListener('resize', alignDropdown);

  const fullHeight = () => {
    const currentMaxHeight = dropdown.style.maxHeight;
    dropdown.style.maxHeight = 'none';
    const h = dropdown.scrollHeight;
    dropdown.style.maxHeight = currentMaxHeight;
    return h;
  };

  dropdownWrap.addEventListener('mouseenter', () => {
    gsap.to(dropdown, { maxHeight: fullHeight(), duration: 0.25, ease: 'power2.out' });
    gsap.to(dropdownItems, { opacity: 1, duration: 0.2, stagger: 0.06, delay: 0.05, ease: 'power2.out' });
  });

  const closeDropdown = () => {
    gsap.to(dropdown, { maxHeight: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to(dropdownItems, { opacity: 0, duration: 0.15, ease: 'power2.in' });
  };

  // Close when mouse leaves the whole nav pill
  nav.addEventListener('mouseleave', closeDropdown);

  // Close when hovering other main links
  document.querySelectorAll('.main-nav .nav-link:not(.nav-dropdown-item)').forEach(link => {
    if (!link.closest('.nav-dropdown-wrap')) {
      link.addEventListener('mouseenter', closeDropdown);
    }
  });
}
