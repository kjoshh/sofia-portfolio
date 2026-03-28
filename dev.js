#!/usr/bin/env node
/**
 * dev.js — Local development server
 *
 * 1. Runs `node build.js` to generate dist/ with CMS data
 * 2. Serves dist/ with browser-sync (live-reload) on port 3000
 * 3. Watches source files (js/, css/, *.html) and syncs changes to dist/
 *    - JS/CSS changes: copied directly (instant)
 *    - HTML changes: triggers full rebuild (re-injects CMS data)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const browserSync = require('browser-sync').create();

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// ── Step 1: Initial build ──────────────────────────────────────
console.log('Building dist/ with CMS data...\n');
try {
  execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  console.error('\nBuild failed. Fix errors above and try again.');
  process.exit(1);
}

// ── Step 2: Start browser-sync on dist/ ────────────────────────
console.log('\nStarting dev server...\n');
browserSync.init({
  server: {
    baseDir: DIST,
    serveStaticOptions: { extensions: ['html'] },
  },
  port: 3000,
  open: false,
  notify: false,
  files: [
    path.join(DIST, '**/*.html'),
    path.join(DIST, 'css/*.css'),
    path.join(DIST, 'js/*.js'),
  ],
});

// ── Step 3: Watch source files and sync to dist/ ───────────────
let rebuildTimer = null;

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function rebuild() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    console.log('\n[dev] HTML changed — rebuilding dist/...');
    try {
      execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });
      console.log('[dev] Rebuild complete.\n');
    } catch (e) {
      console.error('[dev] Rebuild failed.\n');
    }
  }, 300);
}

// Watch js/ and css/ — direct copy to dist/
for (const dir of ['js', 'css']) {
  const srcDir = path.join(ROOT, dir);
  if (!fs.existsSync(srcDir)) continue;
  fs.watch(srcDir, { recursive: true }, (event, filename) => {
    if (!filename) return;
    const src = path.join(srcDir, filename);
    const dest = path.join(DIST, dir, filename);
    if (fs.existsSync(src)) {
      copyFile(src, dest);
      console.log(`[dev] Synced ${dir}/${filename}`);
    }
  });
}

// Watch root HTML files — full rebuild (to inject CMS data)
fs.watch(ROOT, (event, filename) => {
  if (!filename || !filename.endsWith('.html')) return;
  if (filename.startsWith('dist') || filename.startsWith('node_modules')) return;
  rebuild();
});

// Watch templates/ — full rebuild
const templatesDir = path.join(ROOT, 'templates');
if (fs.existsSync(templatesDir)) {
  fs.watch(templatesDir, { recursive: true }, (event, filename) => {
    if (filename && filename.endsWith('.html')) rebuild();
  });
}
