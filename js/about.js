/* ── WebGL shader background (vanilla — no Three.js) ── */
(function () {
  if ('ontouchstart' in window || window.innerWidth < 768) return;

  const VERT = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;
  const FRAG = `
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
      return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
    }
    float turbulence(vec2 p) {
      float t = 0.0; float w = 0.5;
      for (int i = 0; i < 6; i++) { t += abs(noise(p)) * w; p *= 2.0; w *= 0.5; }
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
  const imgEl = container.querySelector("img");
  const targetMouse = { x: 0.5, y: 0.5 };
  const lerpedMouse = { x: 0.5, y: 0.5 };
  let targetRadius = 0, currentRadius = 0, time = 0;
  let gl, program, locs, rafId;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function compileShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function init(image) {
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Texture
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Uniform locations
    locs = {};
    ["u_texture","u_mouse","u_time","u_resolution","u_radius","u_speed","u_imageAspect","u_turbulenceIntensity"]
      .forEach(name => { locs[name] = gl.getUniformLocation(program, name); });

    // Set static uniforms
    gl.uniform1i(locs.u_texture, 0);
    gl.uniform1f(locs.u_speed, config.maskSpeed);
    gl.uniform1f(locs.u_imageAspect, imageAspect);
    gl.uniform1f(locs.u_turbulenceIntensity, config.turbulenceIntensity);
    gl.uniform2f(locs.u_resolution, canvas.width, canvas.height);

    imgEl.style.display = "none";
    container.appendChild(canvas);
    // Render one frame (grayscale, radius 0) then sleep
    drawFrame();
  }

  let running = false;

  function wake() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(animate);
  }

  document.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right
                && e.clientY >= rect.top  && e.clientY <= rect.bottom;
    if (inside) {
      targetMouse.x = (e.clientX - rect.left) / rect.width;
      targetMouse.y = 1 - (e.clientY - rect.top) / rect.height;
      targetRadius = config.maskRadius;
    } else {
      targetRadius = 0;
    }
    wake();
  });

  function drawFrame() {
    gl.uniform2f(locs.u_mouse, lerpedMouse.x, lerpedMouse.y);
    gl.uniform1f(locs.u_time, time);
    gl.uniform1f(locs.u_radius, currentRadius);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function animate() {
    lerpedMouse.x = lerp(lerpedMouse.x, targetMouse.x, config.lerpFactor);
    lerpedMouse.y = lerp(lerpedMouse.y, targetMouse.y, config.lerpFactor);
    currentRadius += (targetRadius - currentRadius) * config.radiusLerpSpeed;
    time += 0.01;
    drawFrame();

    // Sleep when radius has fully settled to 0
    if (targetRadius === 0 && currentRadius < 0.001) {
      currentRadius = 0;
      running = false;
      return;
    }
    rafId = requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    gl.canvas.width = container.clientWidth * dpr;
    gl.canvas.height = container.clientHeight * dpr;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(locs.u_resolution, gl.canvas.width, gl.canvas.height);
  });

  // Load image then init
  if (imgEl.complete) {
    init(imgEl);
  } else {
    imgEl.addEventListener("load", () => init(imgEl));
  }
})();


/* ── Section accordion ── */
function closeSection(body, titleEl) {
  const lines = body.querySelectorAll("p");
  body.style.overflow = "hidden";
  gsap.to(lines, {
    opacity: 0, y: 8, duration: 0.25, stagger: { each: 0.04, from: "end" },
    ease: "power2.in",
    onComplete: () => gsap.to(body, { height: 0, marginTop: 0, duration: 0.3, ease: "power2.inOut" })
  });
  titleEl.classList.remove("open");
}

function openSection(body, titleEl) {
  const lines = body.querySelectorAll("p");
  gsap.set(lines, { opacity: 0, y: 8 });
  body.style.overflow = "hidden";
  gsap.to(body, {
    height: "auto", marginTop: 6, duration: 0.35, ease: "power2.inOut",
    onComplete: () => {
      body.style.overflow = "visible";
      gsap.to(lines, { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "power2.out" });
    }
  });
  titleEl.classList.add("open");
}

document.querySelectorAll(".about-section-title").forEach(title => {
  title.addEventListener("click", () => {
    const body = title.nextElementSibling;
    const isOpen = title.classList.contains("open");
    document.querySelectorAll(".about-section-title.open").forEach(t => {
      closeSection(t.nextElementSibling, t);
    });
    if (!isOpen) openSection(body, title);
  });
});

gsap.from(".corner", {
  opacity: 0, y: 12, duration: 0.6,
  stagger: 0.1, ease: "power2.out",
  delay: 0.5
});


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
  setInterval(tick, 1000);
})();

/* ── Mobile contact rows entrance ── */
if (window.innerWidth < 768) {
  gsap.to(".contact-row, .contact-footnote", {
    opacity: 1, y: 0, duration: 0.55,
    stagger: 0.07, ease: "power2.out", delay: 0.4
  });
}
