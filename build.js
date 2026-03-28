#!/usr/bin/env node
/**
 * build.js — Static site generator for Sofia Portfolio
 *
 * Reads CMS data from _data/ and generates final HTML into dist/.
 * Triggered automatically by Netlify on every push (including Decap CMS edits).
 *
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, '_data');
const CLOUD = 'dnvwadmaj';
const CDN = `https://res.cloudinary.com/${CLOUD}/image/upload`;

// ── Helpers ─────────────────────────────────────────────────────

function cloudUrl(publicId, { width, ext = 'jpg' } = {}) {
  const transforms = width ? `w_${width},f_auto,q_auto` : 'f_auto,q_auto';
  return `${CDN}/${transforms}/${publicId}.${ext}`;
}

function srcset(publicId, { ext = 'jpg', sizes = '20vw' } = {}) {
  const widths = [500, 800, 1200, 1600, 2400];
  const set = widths
    .map(w => `${cloudUrl(publicId, { width: w, ext })} ${w}w`)
    .join(',\n             ');
  return `src="${cloudUrl(publicId, { width: 400, ext })}"
         srcset="${set}"
         sizes="${sizes}"`;
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest, skip = new Set()) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  ensureDir(dest);
  for (const entry of entries) {
    if (skip.has(entry.name)) continue;
    // Skip hidden files/dirs (dotfiles)
    if (entry.name.startsWith('.')) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath, skip);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Load CMS Data ───────────────────────────────────────────────

function loadProjects() {
  const dir = path.join(DATA, 'projects');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => readJSON(path.join(dir, f)))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function loadArchive() {
  const file = path.join(DATA, 'archive.json');
  if (!fs.existsSync(file)) return [];
  const data = readJSON(file);
  // Support both array (direct) and {body: [...]} (Decap CMS wraps file collections)
  const items = Array.isArray(data) ? data : (data.body || []);
  return items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function loadSettings() {
  const file = path.join(DATA, 'settings.json');
  if (!fs.existsSync(file)) return {};
  return readJSON(file);
}

// ── HTML Generators ─────────────────────────────────────────────

function genDeskNav(projects, sizes = '20vw') {
  return projects.map(p => `                <a href="${p.slug}.html" class="desk-nav-cell">
                  <img ${srcset(p.thumbnail, { sizes })}
         loading="lazy" class="desk-nav-cell-img" alt="${p.title}">
                  <span class="desk-nav-cell-label">${p.title}</span>
                </a>`).join('\n');
}

function genMobNav(projects, sizes = '20vw') {
  return projects.map(p => `        <a href="${p.slug}.html" class="mob-sheet-cell">
          <img ${srcset(p.thumbnail, { sizes })}
         loading="lazy" class="mob-sheet-cell-img" alt="${p.title}">
          <span class="mob-sheet-cell-label">${p.title}</span>
        </a>`).join('\n');
}

function genGalleryImages(gallery) {
  return gallery.map((id, i) => {
    const num = i + 1;
    return `      <div id="img${num}" class="imgholder hovv"><img ${srcset(id)}
         loading="lazy" alt="" class="pro-img hovv">
      </div>`;
  }).join('\n');
}

function genInfoText(paragraphs) {
  return paragraphs.map(p => `      <p class="info-para">${p}</p>`).join('\n');
}

function genArchiveGrid(items) {
  return items.map(item => {
    const bwClass = item.is_bw ? ' bw' : '';
    return `    <div class="archive-grid-item${bwClass}" data-full="${cloudUrl(item.image)}"><img crossorigin="anonymous" ${srcset(item.image, { sizes: '(max-width: 768px) 50vw, 25vw' })}
         loading="lazy" alt=""></div>`;
  }).join('\n');
}

// ── Nav Replacement ─────────────────────────────────────────────

function replaceNavs(html, projects, sizes) {
  // Replace desktop nav grid content
  html = html.replace(
    /(<div class="desk-nav-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>)/,
    `$1\n${genDeskNav(projects, sizes)}\n              $2`
  );

  // Replace mobile nav grid content
  html = html.replace(
    /(<div class="mob-sheet-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>)/,
    `$1\n${genMobNav(projects, sizes)}\n      $2`
  );

  return html;
}

// ── Build Project Pages ─────────────────────────────────────────

function buildProjectPages(projects) {
  const template = fs.readFileSync(path.join(ROOT, 'templates', 'project.html'), 'utf8');

  for (const project of projects) {
    let html = template;
    html = html.replace(/\{\{TITLE\}\}/g, project.title);
    html = html.replace(/\{\{TITLE_UPPER\}\}/g, project.title.toUpperCase());
    html = html.replace(/\{\{SLUG\}\}/g, project.slug);
    html = html.replace(/\{\{IMAGE_COUNT\}\}/g, String(project.gallery.length));
    html = html.replace('{{GALLERY_IMAGES}}', genGalleryImages(project.gallery));
    html = html.replace('{{INFO_TEXT}}', genInfoText(project.info_text));
    html = html.replace('{{DESK_NAV}}', genDeskNav(projects));
    html = html.replace('{{MOB_NAV}}', genMobNav(projects));

    fs.writeFileSync(path.join(DIST, `${project.slug}.html`), html);
    console.log(`  Built: ${project.slug}.html`);
  }
}

// ── Build Archive Page ──────────────────────────────────────────

function buildArchivePage(projects, archiveItems) {
  let html = fs.readFileSync(path.join(ROOT, 'archive.html'), 'utf8');

  // Replace archive grid content
  html = html.replace(
    /(<div class="archive-grid">)[\s\S]*?(<\/div>\s*<\/main>)/,
    `$1\n${genArchiveGrid(archiveItems)}\n  </div>\n  </main>`
  );

  html = replaceNavs(html, projects, '(max-width: 768px) 50vw, 25vw');
  fs.writeFileSync(path.join(DIST, 'archive.html'), html);
  console.log('  Built: archive.html');
}

// ── Build About Page ────────────────────────────────────────────

function buildAboutPage(projects, settings) {
  let html = fs.readFileSync(path.join(ROOT, 'about.html'), 'utf8');

  // Replace greeting text
  if (settings.greeting_line1 && settings.greeting_line2) {
    html = html.replace(
      /<div class="about-greeting">[\s\S]*?<\/div>/,
      `<div class="about-greeting">\n      <span class="greet-line1">${settings.greeting_line1}</span><span class="greet-line2">${settings.greeting_line2}</span>\n    </div>`
    );
  }

  // Replace about hero image
  if (settings.about_hero) {
    html = html.replace(
      /(<div class="about-bg">\s*<img[^>]*?)src="[^"]*"[\s\S]*?sizes="[^"]*"/,
      `$1${srcset(settings.about_hero, { sizes: '50vw' })}`
    );
  }

  html = replaceNavs(html, projects, '50vw');
  fs.writeFileSync(path.join(DIST, 'about.html'), html);
  console.log('  Built: about.html');
}

// ── Build Index Page ────────────────────────────────────────────

function buildIndexPage(projects, settings) {
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  html = replaceNavs(html, projects, '30vw');
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  console.log('  Built: index.html');
}

// ── Build CSS (hero images) ─────────────────────────────────────

function buildCSS(settings) {
  const cssPath = path.join(DIST, 'css', 'custom.css');
  if (!fs.existsSync(cssPath)) return;

  let css = fs.readFileSync(cssPath, 'utf8');

  if (settings.index_hero_sofia) {
    css = css.replace(
      /url\('[^']*heroimg-sofia[^']*'\)/g,
      `url('${cloudUrl(settings.index_hero_sofia)}')`
    );
  }
  if (settings.index_hero_sybil) {
    css = css.replace(
      /url\('[^']*heroimg-sybil[^']*'\)/g,
      `url('${cloudUrl(settings.index_hero_sybil)}')`
    );
  }

  fs.writeFileSync(cssPath, css);
  console.log('  Built: css/custom.css (hero images)');
}

// ── Build JS (hero image IDs) ───────────────────────────────────

function buildJS(settings) {
  const jsPath = path.join(DIST, 'js', 'index.js');
  if (!fs.existsSync(jsPath)) return;

  let js = fs.readFileSync(jsPath, 'utf8');

  if (settings.index_hero_sofia) {
    js = js.replace(
      /(['"])heroimg-sofia[^'"]*\1/g,
      `'${settings.index_hero_sofia}'`
    );
  }
  if (settings.index_hero_sybil) {
    js = js.replace(
      /(['"])heroimg-sybil[^'"]*\1/g,
      `'${settings.index_hero_sybil}'`
    );
  }

  fs.writeFileSync(jsPath, js);
  console.log('  Built: js/index.js (hero image IDs)');
}

// ── Main ────────────────────────────────────────────────────────

function main() {
  console.log('Building Sofia Portfolio...\n');

  // Load data
  const projects = loadProjects();
  const archiveItems = loadArchive();
  const settings = loadSettings();

  console.log(`  ${projects.length} projects`);
  console.log(`  ${archiveItems.length} archive images`);
  console.log('');

  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }

  // Copy static files to dist (skip build artifacts and source-only dirs)
  const skip = new Set([
    'dist', 'node_modules', '_data', 'templates', 'admin',
    'build.js', 'serve.mjs', 'screenshot.mjs', 'migrate-images.js',
    'cloudinary-map.json', 'cms-migration-plan.md',
    'temporary screenshots', '.git', '.claude', 'CLAUDE.md',
    'skills-lock.json', 'package.json', 'package-lock.json'
  ]);
  copyRecursive(ROOT, DIST, skip);
  console.log('  Copied static files to dist/\n');

  // Copy admin panel to dist
  const adminSrc = path.join(ROOT, 'admin');
  if (fs.existsSync(adminSrc)) {
    copyRecursive(adminSrc, path.join(DIST, 'admin'));
    console.log('  Copied admin/ panel\n');
  }

  // Generate pages
  buildProjectPages(projects);
  buildArchivePage(projects, archiveItems);
  buildAboutPage(projects, settings);
  buildIndexPage(projects, settings);
  console.log('');

  // Update CSS and JS with dynamic values
  buildCSS(settings);
  buildJS(settings);

  // Also build 404 page with nav (just copy and replace navs)
  const page404src = path.join(ROOT, '404.html');
  if (fs.existsSync(page404src)) {
    let html404 = fs.readFileSync(page404src, 'utf8');
    html404 = replaceNavs(html404, projects, '20vw');
    fs.writeFileSync(path.join(DIST, '404.html'), html404);
    console.log('  Built: 404.html');
  }

  console.log('\nDone! Output in dist/');
}

main();
