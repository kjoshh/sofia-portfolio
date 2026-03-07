/* ── WebGL shader background ── */
(function () {
  const vertexShader = `
    varying vec2 v_uv;
    void main() {
      v_uv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
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
  const targetMouse = new THREE.Vector2(0.5, 0.5);
  const lerpedMouse = new THREE.Vector2(0.5, 0.5);
  let targetRadius = 0, scene, camera, renderer, uniforms;

  new THREE.TextureLoader().load(img.src, (texture) => {
    const imageAspect = texture.image.width / texture.image.height;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    uniforms = {
      u_texture:             { value: texture },
      u_mouse:               { value: new THREE.Vector2(0.5, 0.5) },
      u_time:                { value: 0 },
      u_resolution:          { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      u_radius:              { value: 0 },
      u_speed:               { value: config.maskSpeed },
      u_imageAspect:         { value: imageAspect },
      u_turbulenceIntensity: { value: config.turbulenceIntensity },
    };
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    );
    scene.add(mesh);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    img.style.display = "none";
    container.appendChild(renderer.domElement);
    animate();
  });

  document.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right
                && e.clientY >= rect.top  && e.clientY <= rect.bottom;
    if (inside) {
      targetMouse.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
      targetRadius = config.maskRadius;
    } else {
      targetRadius = 0;
    }
  });

  function animate() {
    requestAnimationFrame(animate);
    lerpedMouse.lerp(targetMouse, config.lerpFactor);
    if (uniforms) {
      uniforms.u_mouse.value.copy(lerpedMouse);
      uniforms.u_time.value += 0.01;
      uniforms.u_radius.value += (targetRadius - uniforms.u_radius.value) * config.radiusLerpSpeed;
    }
    if (renderer) renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    if (!renderer) return;
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (uniforms) uniforms.u_resolution.value.set(container.clientWidth, container.clientHeight);
  });
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
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit"
  });
  function tick() { el.textContent = fmt.format(new Date()); }
  tick();
  setInterval(tick, 1000);
})();
