#!/usr/bin/env node
/**
 * build.js — Static site generator for Sofia Portfolio
 *
 * Fetches CMS data from Sanity and generates final HTML into dist/.
 * Triggered automatically by Cloudflare Pages on every push.
 *
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const CleanCSS = require('clean-css');
const { minify: terserMinify } = require('terser');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const BUILD_VERSION = Date.now();
const SANITY_PROJECT = '4g1grp0d';
const SANITY_DATASET = 'production';
const SANITY_CDN = `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}`;

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Parse a Sanity image asset ref (e.g. "image-abc123-300x200-jpg")
 * into a CDN-usable path segment ("abc123-300x200.jpg").
 */
function sanityRefToPath(ref) {
  // ref format: image-{id}-{dimensions}-{ext}
  const parts = ref.replace(/^image-/, '');
  const lastDash = parts.lastIndexOf('-');
  const ext = parts.substring(lastDash + 1);
  const rest = parts.substring(0, lastDash);
  return `${rest}.${ext}`;
}

/**
 * Generate image src from a Sanity image object.
 * Accepts { asset: { _ref } } or a raw URL string.
 */
function imgSrc(value, { width } = {}) {
  if (!value) return '';
  if (typeof value === 'string') return value; // already a URL
  const ref = value.asset?._ref || value.asset?._id;
  if (!ref) return '';
  const imgPath = sanityRefToPath(ref);
  const params = width ? `?w=${width}&auto=format` : '?auto=format';
  return `${SANITY_CDN}/${imgPath}${params}`;
}

/**
 * Generate srcset attribute from a Sanity image object.
 */
function srcset(value, { sizes = '20vw' } = {}) {
  if (!value) return 'src=""';
  if (typeof value === 'string') return `src="${value}" sizes="${sizes}"`;
  const ref = value.asset?._ref || value.asset?._id;
  if (!ref) return 'src=""';
  const imgPath = sanityRefToPath(ref);
  const widths = [500, 800, 1200, 1600, 2400];
  const set = widths
    .map(w => `${SANITY_CDN}/${imgPath}?w=${w}&auto=format ${w}w`)
    .join(',\n             ');
  return `src="${SANITY_CDN}/${imgPath}?w=400&auto=format"
         srcset="${set}"
         sizes="${sizes}"`;
}

function cloudUrl(value) { return imgSrc(value); }

/**
 * Fetch data from Sanity GROQ API (read-only, no token needed for public dataset).
 */
function groq(query) {
  return new Promise((resolve, reject) => {
    const url = `https://${SANITY_PROJECT}.api.sanity.io/v2021-06-07/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`Sanity ${res.statusCode}: ${data}`));
        resolve(JSON.parse(data).result);
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Sanity API timeout (30s)')); });
  });
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

// ── Load CMS Data from Sanity ───────────────────────────────────

async function loadProjects() {
  const results = await groq(`*[_type == "project"] | order(sortOrder asc) {
    title,
    "slug": slug.current,
    thumbnail,
    gallery,
    "info_text": infoText,
    "info_tab_label": coalesce(infoTabLabel, "Info"),
    "sort_order": sortOrder
  }`);
  return results;
}

async function loadArchive() {
  const results = await groq(`*[_type == "archiveImage"] | order(sortOrder asc) {
    image,
    "is_bw": isBw,
    "sort_order": sortOrder
  }`);
  return results;
}

async function loadSettings() {
  const result = await groq(`*[_type == "siteSettings"][0] {
    "greeting_line2": greetingLine2,
    exhibitions,
    publications
  }`);
  return result || {};
}

// ── HTML Generators ─────────────────────────────────────────────

function genDeskNav(projects, sizes = '20vw') {
  return projects.map(p => {
    const alt = (p.thumbnail?.alt || p.title).replace(/"/g, '&quot;');
    return `                <a href="${p.slug}.html" class="desk-nav-cell">
                  <img ${srcset(p.thumbnail, { sizes })}
         loading="lazy" class="desk-nav-cell-img" alt="${alt}">
                  <span class="desk-nav-cell-label">${p.title}</span>
                </a>`;
  }).join('\n');
}

function genMobNav(projects, sizes = '20vw') {
  return projects.map(p => {
    const alt = (p.thumbnail?.alt || p.title).replace(/"/g, '&quot;');
    return `        <a href="${p.slug}.html" class="mob-sheet-cell">
          <img ${srcset(p.thumbnail, { sizes })}
         loading="lazy" class="mob-sheet-cell-img" alt="${alt}">
          <span class="mob-sheet-cell-label">${p.title}</span>
        </a>`;
  }).join('\n');
}

function genGalleryImages(gallery) {
  return gallery.map((img, i) => {
    const num = i + 1;
    const alt = (img.alt || '').replace(/"/g, '&quot;');
    return `      <div id="img${num}" class="imgholder hovv"><img ${srcset(img)}
         loading="lazy" alt="${alt}" class="pro-img hovv">
      </div>`;
  }).join('\n');
}

function genInfoText(text) {
  if (Array.isArray(text)) {
    return text.map(p => `      <p class="info-para">${p}</p>`).join('\n');
  }
  // Markdown string — split on double newlines into paragraphs
  return String(text || '').split(/\n\n+/).filter(Boolean)
    .map(p => `      <p class="info-para">${p.trim()}</p>`).join('\n');
}

function genArchiveGrid(items) {
  return items.map(item => {
    const bwClass = item.is_bw ? ' bw' : '';
    const alt = (item.image?.alt || '').replace(/"/g, '&quot;');
    return `    <div class="archive-grid-item${bwClass}" data-full="${imgSrc(item.image)}"><img ${srcset(item.image, { sizes: '(max-width: 768px) 50vw, 25vw' })}
         loading="lazy" alt="${alt}"></div>`;
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
    html = html.replace(/\{\{INFO_TAB_LABEL\}\}/g, project.info_tab_label || 'Info');
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

  // Replace greeting line 2
  if (settings.greeting_line2) {
    html = html.replace(
      /<div class="about-greeting">[\s\S]*?<\/div>/,
      `<div class="about-greeting">\n      <span class="greet-line1">Hi, I'm Sofia Cartuccia,</span><span class="greet-line2">${settings.greeting_line2}</span>\n    </div>`
    );
  }

  // Replace exhibitions
  if (settings.exhibitions && settings.exhibitions.length) {
    const exHtml = settings.exhibitions.map(e => `          <p>${e}</p>`).join('\n');
    html = html.replace(
      /(<span class="about-section-title"[^>]*>SELECTED EXHIBITIONS<\/span>\s*<div class="about-section-body">)[\s\S]*?(<\/div>)/,
      `$1\n${exHtml}\n        $2`
    );
  }

  // Replace publications
  if (settings.publications && settings.publications.length) {
    const pubHtml = settings.publications.map(p => `          <p>${p}</p>`).join('\n');
    html = html.replace(
      /(<span class="about-section-title"[^>]*>SELECTED PUBLICATIONS<\/span>\s*<div class="about-section-body">)[\s\S]*?(<\/div>)/,
      `$1\n${pubHtml}\n        $2`
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

async function main() {
  console.log('Building Sofia Portfolio...\n');

  // Load data from Sanity
  const [projects, archiveItems, settings] = await Promise.all([
    loadProjects(),
    loadArchive(),
    loadSettings(),
  ]);

  console.log(`  ${projects.length} projects`);
  console.log(`  ${archiveItems.length} archive images`);
  console.log('');

  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }

  // Copy static files to dist (skip build artifacts and source-only dirs)
  const skip = new Set([
    'dist', 'node_modules', '_data', 'templates', 'admin', 'studio',
    'build.js', 'dev.js', 'serve.mjs', 'screenshot.mjs', 'migrate-images.js',
    'migrate-to-sanity.js', 'cloudinary-map.json', 'cms-migration-plan.md', 'netlify.toml',
    'temporary screenshots', '.git', '.claude', 'CLAUDE.md',
    'skills-lock.json', 'package.json', 'package-lock.json',
    'sitemap.xml'
  ]);
  copyRecursive(ROOT, DIST, skip);
  console.log('  Copied static files to dist/\n');

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

  // Minify CSS
  const cssPath = path.join(DIST, 'css', 'custom.css');
  if (fs.existsSync(cssPath)) {
    const cssSource = fs.readFileSync(cssPath, 'utf8');
    const minCSS = new CleanCSS().minify(cssSource);
    fs.writeFileSync(cssPath, minCSS.styles);
    console.log(`  Minified CSS: ${cssSource.length} → ${minCSS.styles.length} bytes (${Math.round((1 - minCSS.styles.length / cssSource.length) * 100)}% reduction)`);
  }

  // Minify JS
  const jsDir = path.join(DIST, 'js');
  if (fs.existsSync(jsDir)) {
    for (const file of fs.readdirSync(jsDir).filter(f => f.endsWith('.js'))) {
      const jsPath = path.join(jsDir, file);
      const jsSource = fs.readFileSync(jsPath, 'utf8');
      const result = await terserMinify(jsSource);
      if (result.code) {
        fs.writeFileSync(jsPath, result.code);
        console.log(`  Minified ${file}: ${jsSource.length} → ${result.code.length} bytes`);
      }
    }
  }

  // Cache-bust: append ?v=TIMESTAMP to local JS and CSS references in all HTML
  const htmlFiles = fs.readdirSync(DIST).filter(f => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const filePath = path.join(DIST, file);
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace(/(src|href)="(js\/[^"]+|css\/[^"]+)"/g, `$1="$2?v=${BUILD_VERSION}"`);
    fs.writeFileSync(filePath, html);
  }
  console.log(`  Cache-busted assets with v=${BUILD_VERSION}`);

  // Generate sitemap.xml with all pages (static + CMS projects)
  const today = new Date().toISOString().split('T')[0];
  const projectSlugs = new Set(projects.map(p => p.slug));
  // Add hand-coded project pages that may not be in CMS
  for (const s of ['hard-coded', 'forgetting-dreams']) projectSlugs.add(s);
  const sitemapPages = [
    { loc: '/', priority: '1.0' },
    { loc: '/about.html', priority: '0.8' },
    { loc: '/archive.html', priority: '0.8' },
    ...[...projectSlugs].map(s => ({ loc: `/${s}.html`, priority: '0.7' })),
  ];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages.map(p => `  <url>
    <loc>https://sofiacartuccia.com${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml);
  console.log(`  Generated sitemap.xml with ${sitemapPages.length} URLs`);

  // Write Cloudflare Pages _headers and _redirects
  fs.writeFileSync(path.join(DIST, '_headers'), `/*.html
  Cache-Control: public, max-age=0, must-revalidate

/css/*
  Cache-Control: public, max-age=31536000, immutable

/js/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
`);
  fs.writeFileSync(path.join(DIST, '_redirects'), `/* /404.html 404
`);
  console.log('  Wrote _headers and _redirects for Cloudflare Pages');

  console.log('\nDone! Output in dist/');
}

main().catch(err => { console.error(err); process.exit(1); });
