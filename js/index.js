// ── Name image overlay ──
const NAME_X = 0.31;
const NAME_Y = 0.72;
const NAME_W = 0.37;

const bgImg = document.querySelector('.sofianamebg');
const name  = document.querySelector('.sofianame');

bgImg.style.display = 'none'; // replaced by WebGL canvas
name.style.zIndex   = '2';

function positionName() {
  const vw = innerWidth, vh = innerHeight;
  const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
  if (!iw || !ih) return;
  const sc = Math.max(vw/iw, vh/ih);
  const rw = iw*sc, rh = ih*sc;
  const ox = (vw-rw)/2, oy = (vh-rh)/2;
  name.style.left  = (ox + NAME_X*rw) + 'px';
  name.style.top   = (oy + NAME_Y*rh) + 'px';
  name.style.width = (NAME_W*rw) + 'px';
}

// ── Cursor parallax ──
const moveX = gsap.quickTo(name, 'x', { duration: 1, ease: 'power2.out' });
const moveY = gsap.quickTo(name, 'y', { duration: 1, ease: 'power2.out' });
window.addEventListener('mousemove', e => {
  moveX((e.clientX/innerWidth  - 0.5) * 2 * 18);
  moveY((e.clientY/innerHeight - 0.5) * 2 * 18);
});


// ── WebGL fluid distortion ──
const glc = document.createElement('canvas');
glc.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;';
document.body.appendChild(glc);

const gl = glc.getContext('webgl');

function resizeGL() {
  glc.width  = innerWidth;
  glc.height = innerHeight;
  gl.viewport(0, 0, glc.width, glc.height);
}
resizeGL();
window.addEventListener('resize', () => { resizeGL(); positionName(); updateCover(); });

// ── Shaders ──
function mkShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}
function mkProg(vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, mkShader(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mkShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}

// Standard WebGL UV: y=0 at bottom of screen
const VS = `
  attribute vec2 a;
  varying vec2 v;
  void main() { v = a*0.5+0.5; gl_Position = vec4(a,0.,1.); }
`;

// Velocity field simulation (ping-pong)
// Velocity stored encoded: vel*0.5+0.5 to fit UNSIGNED_BYTE [0,1]
const SIM_FS = `
  precision highp float;
  uniform sampler2D uF;
  uniform vec2 uT;   // texel size
  uniform vec2 uM;   // mouse UV (WebGL space, y flipped)
  uniform vec2 uV;   // mouse velocity
  varying vec2 v;

  void main() {
    // Diffuse: average of 5 neighbours
    vec2 vel = (
      texture2D(uF, v+vec2(uT.x,0.)).rg +
      texture2D(uF, v-vec2(uT.x,0.)).rg +
      texture2D(uF, v+vec2(0.,uT.y)).rg +
      texture2D(uF, v-vec2(0.,uT.y)).rg +
      texture2D(uF, v).rg
    ) * 0.2;

    // Decode from [0,1] → [-1,1]
    vel = vel * 2.0 - 1.0;

    // Decay
    vel *= 0.965;

    // Snap tiny values to zero (avoids UNSIGNED_BYTE quantization drift)
    vel = abs(vel) < 0.004 ? vec2(0.) : vel;

    // Inject mouse velocity
    float d = length(v - uM);
    vel += uV * smoothstep(0.14, 0.0, d);
    vel = clamp(vel, -1., 1.);

    // Encode back to [0,1]
    gl_FragColor = vec4(vel*0.5+0.5, 0., 1.);
  }
`;

// Display: sample photo with UV displaced by velocity field
const DISP_FS = `
  precision highp float;
  uniform sampler2D uPhoto, uF;
  uniform vec2 uSc, uOff;
  varying vec2 v;

  void main() {
    // Decode velocity
    vec2 vel = texture2D(uF, v).rg * 2.0 - 1.0;

    // Displace UV
    vec2 uv = v + vel * 0.07;

    // Map to photo UV space (object-fit: cover, UNPACK_FLIP_Y applied)
    vec2 photoUV = clamp(uv * uSc + uOff, 0., 1.);
    gl_FragColor = texture2D(uPhoto, photoUV);
  }
`;

const simProg  = mkProg(VS, SIM_FS);
const dispProg = mkProg(VS, DISP_FS);

// ── Fullscreen quad ──
const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

function bindQuad(prog) {
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}

// ── Ping-pong FBOs for velocity field ──
const SIM_RES = 256;

function makeFBO() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SIM_RES, SIM_RES, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fbo };
}

let read = makeFBO(), write = makeFBO();

// ── Photo texture ──
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // match WebGL UV (y=0 at bottom)
const photoTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, photoTex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// Object-fit cover uniforms (WebGL UV: y=0 at bottom)
let coverSc = [1,1], coverOff = [0,0];
function updateCover() {
  const vw = innerWidth, vh = innerHeight;
  const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
  if (!iw || !ih) return;
  const sc = Math.max(vw/iw, vh/ih);
  const rw = iw*sc, rh = ih*sc;
  const ox = (vw-rw)/2, oy = (vh-rh)/2;
  // uSc, uOff map WebGL UV (y=0 at bottom) → photo UV (y=0 at bottom, UNPACK_FLIP_Y)
  coverSc  = [vw/rw, vh/rh];
  coverOff = [-ox/rw, 1.0 - (vh - oy)/rh];
}

function onLoad() {
  gl.bindTexture(gl.TEXTURE_2D, photoTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImg);
  positionName();
  updateCover();
}

bgImg.decode
  ? bgImg.decode().then(onLoad)
  : bgImg.addEventListener('load', onLoad);

// ── Mouse input ──
let mouse = [0.5, 0.5], vel = [0, 0];
window.addEventListener('mousemove', e => {
  const nx = e.clientX / innerWidth;
  const ny = 1.0 - e.clientY / innerHeight; // flip Y for WebGL space
  vel   = [(nx - mouse[0]) * 7, (ny - mouse[1]) * 7];
  mouse = [nx, ny];
});

// ── Render loop ──
function frame() {
  requestAnimationFrame(frame);

  // Simulation pass → write FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
  gl.viewport(0, 0, SIM_RES, SIM_RES);
  gl.useProgram(simProg);
  bindQuad(simProg);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, read.tex);
  gl.uniform1i(gl.getUniformLocation(simProg, 'uF'), 0);
  gl.uniform2f(gl.getUniformLocation(simProg, 'uT'), 1/SIM_RES, 1/SIM_RES);
  gl.uniform2f(gl.getUniformLocation(simProg, 'uM'), mouse[0], mouse[1]);
  gl.uniform2f(gl.getUniformLocation(simProg, 'uV'), vel[0], vel[1]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  [read, write] = [write, read];
  vel = [0, 0];

  // Display pass → screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, glc.width, glc.height);
  gl.useProgram(dispProg);
  bindQuad(dispProg);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, photoTex);
  gl.uniform1i(gl.getUniformLocation(dispProg, 'uPhoto'), 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, read.tex);
  gl.uniform1i(gl.getUniformLocation(dispProg, 'uF'), 1);
  gl.uniform2fv(gl.getUniformLocation(dispProg, 'uSc'),  coverSc);
  gl.uniform2fv(gl.getUniformLocation(dispProg, 'uOff'), coverOff);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

frame();
