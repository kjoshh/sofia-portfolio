/* ── Mobile detection ── */
const isMobile = () => window.matchMedia('(max-width: 991px)').matches;

/* ── Lenis smooth scroll (mobile only) ── */
if (isMobile()) {
  const lenis = new Lenis();
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
}

/* ── WebGL shader background (vanilla WebGL, no Three.js) ── */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 768) return;

  const vsSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = vec2(a_position.x * 0.5 + 0.5, 1.0 - (a_position.y * 0.5 + 0.5));
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  const fsSource = `
    precision highp float;
    uniform sampler2D u_texture;
    uniform vec2 u_mouse;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_radius;
    uniform float u_speed;
    uniform float u_imageAspect;
    uniform float u_turbulenceIntensity;
    varying vec2 v_uv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i+vec2(0,0)),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
    }
    float turbulence(vec2 p) {
      float t = 0.0; float w = 0.5;
      for (int i = 0; i < 8; i++) { t += abs(noise(p)) * w; p *= 2.0; w *= 0.5; }
      return t;
    }
    void main() {
      vec2 uv = v_uv;
      float screenAspect = u_resolution.x / u_resolution.y;
      vec2 texCoord = uv;
      if (u_imageAspect > screenAspect) {
        texCoord.x = 0.5 + (uv.x - 0.5) * (screenAspect / u_imageAspect);
      } else {
        texCoord.y = 0.5 + (uv.y - 0.5) * (u_imageAspect / screenAspect);
      }
      vec4 tex = texture2D(u_texture, texCoord);
      float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 invertedGray = vec3(1.0 - gray);
      vec2 correctedUV = uv; correctedUV.x *= screenAspect;
      vec2 correctedMouse = u_mouse; correctedMouse.x *= screenAspect;
      float dist = distance(correctedUV, correctedMouse);
      float jaggedDist = dist + (turbulence(uv * 25.0 + u_time * u_speed) - 0.5) * u_turbulenceIntensity;
      float mask = step(jaggedDist, u_radius);
      gl_FragColor = vec4(mix(invertedGray, tex.rgb, 1.0 - mask), 1.0);
    }
  `;

  const config = {
    maskRadius: 0.15,
    maskSpeed: 0.75,
    lerpFactor: 0.05,
    radiusLerpSpeed: 0.1,
    turbulenceIntensity: 0.075
  };

  const container = document.querySelector(".about-bg");
  const img = container.querySelector("img");
  const targetMouse = { x: 0.5, y: 0.5 };
  const lerpedMouse = { x: 0.5, y: 0.5 };
  let targetRadius = 0;
  let gl, program, uLocs, timeVal = 0, radiusVal = 0;
  let glShaders, glBuffer, glTexture, observer;
  let rafId = null, paused = false;
  let revealDone = false;
  let mouseMoving = false;
  let mouseIdleTimer = null;
  window._webglRevealDone = false;

  function compileShader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function init(image) {
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + "px";
    canvas.style.height = container.clientHeight + "px";

    gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    glShaders = [vs, fs];
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    /* fullscreen quad: two triangles */
    glBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    /* texture */
    glTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    /* uniform locations */
    uLocs = {
      u_texture:             gl.getUniformLocation(program, "u_texture"),
      u_mouse:               gl.getUniformLocation(program, "u_mouse"),
      u_time:                gl.getUniformLocation(program, "u_time"),
      u_resolution:          gl.getUniformLocation(program, "u_resolution"),
      u_radius:              gl.getUniformLocation(program, "u_radius"),
      u_speed:               gl.getUniformLocation(program, "u_speed"),
      u_imageAspect:         gl.getUniformLocation(program, "u_imageAspect"),
      u_turbulenceIntensity: gl.getUniformLocation(program, "u_turbulenceIntensity"),
    };

    gl.uniform1i(uLocs.u_texture, 0);
    gl.uniform1f(uLocs.u_speed, config.maskSpeed);
    gl.uniform1f(uLocs.u_imageAspect, imageAspect);
    gl.uniform1f(uLocs.u_turbulenceIntensity, config.turbulenceIntensity);
    gl.uniform2f(uLocs.u_resolution, canvas.width, canvas.height);

    img.style.display = "none";
    container.appendChild(canvas);

    /* Render one initial frame so the base image (grayscale, radius=0) shows */
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(uLocs.u_mouse, lerpedMouse.x, lerpedMouse.y);
    gl.uniform1f(uLocs.u_time, 0);
    gl.uniform1f(uLocs.u_radius, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    /* Don't start the loop — wait for reveal completion */
  }

  function startLoop() {
    if (!rafId && !paused && revealDone) rafId = requestAnimationFrame(animate);
  }
  function stopLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }
  /* expose pause/resume for accordion */
  window._webglPause = function () { paused = true; targetRadius = 0; stopLoop(); };
  window._webglResume = function () {
    paused = false;
    if (window._webglRevealDone) revealDone = true;
    startLoop();
  };

  /* load image into WebGL */
  if (img.complete && img.naturalWidth) {
    init(img);
  } else {
    img.addEventListener("load", () => init(img));
  }

  document.addEventListener("mousemove", (e) => {
    if (!revealDone) return;

    const rect = container.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right
                && e.clientY >= rect.top  && e.clientY <= rect.bottom;

    if (inside) {
      targetMouse.x = (e.clientX - rect.left) / rect.width;
      targetMouse.y = (e.clientY - rect.top) / rect.height;
      targetRadius = config.maskRadius;
    } else {
      targetRadius = 0;
    }

    mouseMoving = true;
    clearTimeout(mouseIdleTimer);
    mouseIdleTimer = setTimeout(() => { mouseMoving = false; }, 300);
    startLoop();
  });

  function animate() {
    lerpedMouse.x += (targetMouse.x - lerpedMouse.x) * config.lerpFactor;
    lerpedMouse.y += (targetMouse.y - lerpedMouse.y) * config.lerpFactor;
    timeVal += 0.01;
    radiusVal += (targetRadius - radiusVal) * config.radiusLerpSpeed;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(uLocs.u_mouse, lerpedMouse.x, lerpedMouse.y);
    gl.uniform1f(uLocs.u_time, timeVal);
    gl.uniform1f(uLocs.u_radius, radiusVal);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    /* Stop loop when idle and mask fully collapsed */
    if (!mouseMoving && radiusVal < 0.001) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(animate);
  }

  /* pause when hero scrolls out of view */
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (paused) { paused = false; startLoop(); }
    } else {
      paused = true; stopLoop();
    }
  }, { threshold: 0 });
  observer.observe(container);

  /* cleanup WebGL resources to prevent GPU memory leaks */
  function cleanupWebGL() {
    stopLoop();
    if (!gl) return;
    if (glTexture)  gl.deleteTexture(glTexture);
    if (glBuffer)   gl.deleteBuffer(glBuffer);
    if (program) {
      if (glShaders) glShaders.forEach(s => { if (s) { gl.detachShader(program, s); gl.deleteShader(s); } });
      gl.deleteProgram(program);
    }
    if (observer) observer.disconnect();
    gl = null;
  }
  window.addEventListener("beforeunload", cleanupWebGL);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") cleanupWebGL();
  });

  window.addEventListener("resize", () => {
    if (!gl) return;
    const dpr = window.devicePixelRatio || 1;
    gl.canvas.width = container.clientWidth * dpr;
    gl.canvas.height = container.clientHeight * dpr;
    gl.canvas.style.width = container.clientWidth + "px";
    gl.canvas.style.height = container.clientHeight + "px";
    gl.uniform2f(uLocs.u_resolution, gl.canvas.width, gl.canvas.height);
  });
})();


/* ── Section accordion ── */
function closeSection(body, titleEl) {
  const lines = body.querySelectorAll("p");
  body.style.overflow = "hidden";
  gsap.to(lines, {
    opacity: 0, y: 8, duration: 0.25, stagger: { each: 0.04, from: "end" },
    ease: "power2.in",
    onComplete: () => gsap.to(body, {
      height: 0, marginTop: 0, duration: 0.3, ease: "power2.inOut",
      onUpdate: () => window._checkAboutScroll && window._checkAboutScroll(),
    })
  });
  titleEl.classList.remove("open");
  titleEl.setAttribute("aria-expanded", "false");
}

function openSection(body, titleEl) {
  const lines = body.querySelectorAll("p");
  gsap.set(lines, { opacity: 0, y: 8 });
  body.style.overflow = "hidden";

  // Measure target height once to avoid per-frame reflow in Chrome
  body.style.height = "auto";
  const targetHeight = body.offsetHeight;
  body.style.height = "0px";

  gsap.to(body, {
    height: targetHeight, marginTop: 6, duration: 0.35, ease: "power2.inOut",
    onUpdate: () => window._checkAboutScroll && window._checkAboutScroll(),
    onComplete: () => {
      body.style.height = "auto";
      body.style.overflow = "visible";
      gsap.to(lines, {
        opacity: 0.85, y: 0, duration: 0.35, stagger: 0.07, ease: "power2.out",
      });
    }
  });
  titleEl.classList.add("open");
  titleEl.setAttribute("aria-expanded", "true");
}

document.querySelectorAll(".about-section-title").forEach(title => {
  // Keyboard: Enter/Space toggles the section
  title.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      title.click();
    }
  });

  title.addEventListener("click", () => {
    const body = title.nextElementSibling;
    const isOpen = title.classList.contains("open");
    document.querySelectorAll(".about-section-title.open").forEach(t => {
      closeSection(t.nextElementSibling, t);
    });
    if (!isOpen) openSection(body, title);
  });
});

/* ── Scroll fade hint on .about-right ── */
(function () {
  const panel = document.querySelector(".about-right");
  if (!panel) return;

  function checkScroll() {
    const hasOverflow = panel.scrollHeight > panel.clientHeight;
    const atTop = panel.scrollTop <= 5;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 5;

    panel.classList.remove("fade-top", "fade-bottom", "fade-both");
    if (hasOverflow) {
      if (!atTop && !atBottom) panel.classList.add("fade-both");
      else if (atTop) panel.classList.add("fade-bottom");
      else if (atBottom) panel.classList.add("fade-top");
    }
  }

  panel.addEventListener("scroll", checkScroll, { passive: true });
  window._checkAboutScroll = checkScroll;
  checkScroll();
})();

/* ── Entrance reveal animation ── */
(function entranceReveal() {
  const mob = isMobile();
  const aboutBg = document.querySelector(".about-bg");
  const greeting = document.querySelector(".about-greeting");
  const scrollHint = document.querySelector(".about-scroll-hint");
  const mainNav = document.querySelector(".main-nav");
  const contentSection = document.querySelector(".about-content-mobile");
  const mobSheet = document.getElementById("mobSheet");

  const tl = gsap.timeline({ delay: 0.25 });

  // Step 1: Hero image fades in with gentle scale
  tl.fromTo(aboutBg,
    { opacity: 0, scale: 1.05 },
    { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
    0
  );

  // Step 2: Greeting text — vertical cut reveal per character
  gsap.set(greeting, { opacity: 1 });
  const greetLine1 = document.querySelector(".greet-line1");
  const greetLine2 = document.querySelector(".greet-line2");

  function verticalCutReveal(el) {
    const text = el.textContent;
    el.textContent = '';
    el.style.display = 'flex';
    el.style.flexWrap = 'wrap';
    const wrappers = [];
    [...text].forEach(ch => {
      const outer = document.createElement('span');
      outer.style.display = 'inline-block';
      outer.style.overflow = 'hidden';
      outer.style.verticalAlign = 'bottom';
      if (ch === ' ') { outer.innerHTML = '&nbsp;'; el.appendChild(outer); return; }
      const inner = document.createElement('span');
      inner.textContent = ch;
      inner.style.display = 'inline-block';
      inner.style.transform = 'translateY(110%)';
      outer.appendChild(inner);
      el.appendChild(outer);
      wrappers.push(inner);
    });
    return wrappers;
  }

  const chars1 = verticalCutReveal(greetLine1);
  const chars2 = verticalCutReveal(greetLine2);

  tl.to(chars1, {
    y: 0, duration: 0.7, ease: "power3.out",
    stagger: 0.025
  }, 0.5);

  const line2Start = 0.5 + chars1.length * 0.025 * 0.5;
  tl.to(chars2, {
    y: 0, duration: 0.7, ease: "power3.out",
    stagger: 0.02
  }, line2Start + 0.15);

  const greetEnd = line2Start + 0.15 + chars2.length * 0.02 + 0.3;

  // Step 3: Scroll hint fades in
  tl.fromTo(scrollHint,
    { opacity: 0 },
    { opacity: 1, duration: 0.5, ease: "power2.out" },
    greetEnd - 0.2
  );

  if (!mob) {
    // Desktop: nav fades in
    tl.fromTo(mainNav,
      { opacity: 0 },
      { opacity: 1, duration: 0.7, ease: "power3.out" },
      greetEnd - 0.4
    );
  } else {
    // Mobile: mob-sheet fades in
    if (mobSheet) {
      tl.fromTo(mobSheet,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power3.out" },
        greetEnd - 0.4
      );
    }
  }

  // Step 4: Content section appears instantly, about-right fades in
  const contentStart = greetEnd - 0.5;
  if (contentSection) tl.set(contentSection, { opacity: 1 }, contentStart);
  const aboutRight = document.querySelector(".about-right");
  tl.fromTo(aboutRight,
    { opacity: 0 },
    { opacity: 1, duration: 0.6, ease: "power3.out" },
    contentStart
  );

  // Step 5: Corner footer fades in
  const cornern = document.querySelector(".cornern");
  tl.fromTo(cornern,
    { opacity: 0 },
    { opacity: 1, duration: 0.6, ease: "power3.out" },
    contentStart
  );

  // Mobile contact rows
  if (mob) {
    tl.to(".contact-row, .contact-footnote", {
      opacity: 1, y: 0, duration: 0.55,
      stagger: 0.07, ease: "power2.out",
    }, "-=0.3");
  }

  // Cleanup: mark body so CSS overrides initial hidden states
  tl.call(() => {
    document.body.classList.add("entrance-revealed");
    gsap.set([aboutBg, greeting, scrollHint, mainNav], { clearProps: "opacity,scale" });
    if (mobSheet) gsap.set(mobSheet, { clearProps: "opacity" });
    /* Enable WebGL shader after reveal completes */
    if (window._webglRevealDone !== undefined) {
      window._webglRevealDone = true;
      if (window._webglResume) window._webglResume();
    }
  });

  // bfcache: on back-nav, show everything immediately
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      document.body.classList.add("entrance-revealed");
      gsap.set([aboutBg, greeting, scrollHint, mainNav, contentSection], { clearProps: "all" });
      if (mobSheet) gsap.set(mobSheet, { clearProps: "opacity" });
      /* Enable WebGL shader on bfcache restore */
      if (window._webglRevealDone !== undefined) {
        window._webglRevealDone = true;
        if (window._webglResume) window._webglResume();
      }
    }
  });
})();


/* ── Italy time clock ── */
(function () {
  const el = document.getElementById("italy-time");
  const elMob = document.getElementById("italy-time-mob");
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit"
  });
  function tick() {
    const t = fmt.format(new Date());
    if (el) el.textContent = t;
    if (elMob) elMob.textContent = t;
  }
  tick();
  let clockId = setInterval(tick, 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearInterval(clockId); clockId = null; }
    else if (!clockId) { tick(); clockId = setInterval(tick, 1000); }
  });
})();

/* ── Copy-to-clipboard with GSAP word-rotate ── */
(function () {
  const timeCorner = document.querySelector('.corner-time');
  if (!timeCorner || typeof gsap === 'undefined') return;

  let current = timeCorner.querySelector('.corner-time-inner');
  const originalHTML = current.innerHTML;
  let restoreTimer = null;
  let animating = false;
  let hovering = false;

  function rotate(newContent, isHTML, cb) {
    if (animating) return;
    animating = true;

    const incoming = document.createElement('span');
    incoming.className = 'corner-time-inner';
    if (isHTML) incoming.innerHTML = newContent;
    else incoming.textContent = newContent;
    timeCorner.appendChild(incoming);
    gsap.set(incoming, { y: -50, opacity: 0, position: 'absolute', top: 0, left: 0 });

    const old = current;
    gsap.to(old, {
      y: 50, opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete() { old.remove(); }
    });
    gsap.to(incoming, {
      y: 0, opacity: 1, duration: 0.25, ease: 'power2.out',
      onComplete() {
        gsap.set(incoming, { clearProps: 'position,top,left' });
        current = incoming;
        animating = false;
        if (cb) cb();
      }
    });
  }

  document.querySelectorAll('.corner.copyable').forEach(el => {
    el.addEventListener('mouseenter', () => {
      hovering = true;
      clearTimeout(restoreTimer);
      rotate('Click to copy', false);
    });
    el.addEventListener('mouseleave', () => {
      hovering = false;
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => {
        if (hovering || animating) return;
        rotate(originalHTML, true);
      }, 150);
    });
    el.addEventListener('click', () => {
      const text = el.dataset.copy;
      const onSuccess = () => { clearTimeout(restoreTimer); rotate('Copied!', false); };
      const onFail = () => { rotate('Copy failed', false); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(onFail);
      } else {
        // Fallback for browsers without Clipboard API
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy') ? onSuccess() : onFail(); }
        catch (_) { onFail(); }
        ta.remove();
      }
    });
  });
})();
