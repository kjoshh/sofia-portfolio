#!/usr/bin/env node
/**
 * One-time migration script: replaces local images/ paths with Cloudinary URLs.
 *
 * - Photo images (archive-*, hard-coded-*, forgetting-dreams-*, heroimg-*) get srcset
 * - UI/texture images (grain, dust, noise, arrows, letters, etc.) get simple URL swap
 * - CSS background-image urls get simple URL swap
 */

const fs = require('fs');
const path = require('path');

const CLOUD = 'dnvwadmaj';
const FOLDER = 'sofia-portfolio';
const BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;

const map = JSON.parse(fs.readFileSync('cloudinary-map.json', 'utf8'));

// Photo images that benefit from responsive srcset
const PHOTO_PREFIXES = ['archive-', 'hard-coded-', 'forgetting-dreams-', 'heroimg-'];
const SRCSET_WIDTHS = [500, 800, 1200, 1600, 2400];

function isPhoto(filename) {
  return PHOTO_PREFIXES.some(p => filename.startsWith(p));
}

// Get file extension from the local filename that maps to this publicId
function getExt(localFilename) {
  return localFilename.split('.').pop();
}

function cloudUrl(publicId, localFilename, transforms = 'f_auto,q_auto') {
  const ext = getExt(localFilename);
  return `${BASE}/${transforms}/${publicId}.${ext}`;
}

function buildSrcset(publicId, localFilename) {
  return SRCSET_WIDTHS
    .map(w => `${cloudUrl(publicId, localFilename, `w_${w},f_auto,q_auto`)} ${w}w`)
    .join(',\n             ');
}

// ── Process HTML files ──
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  let count = 0;

  // Replace <img src="images/..." ...>
  // For photos: add srcset + sizes + loading="lazy"
  // For non-photos: just swap URL
  html = html.replace(
    /(<img\s[^>]*?)src="images\/([^"]+)"([^>]*?>)/g,
    (match, before, filename, after) => {
      const pid = map[filename];
      if (!pid) {
        console.warn(`  ⚠ No mapping for: ${filename} in ${file}`);
        return match;
      }
      count++;

      if (isPhoto(filename)) {
        const src = cloudUrl(pid, filename, 'w_800,f_auto,q_auto');
        const srcset = buildSrcset(pid, filename);
        // Remove existing loading/srcset/sizes if present
        let cleanBefore = before.replace(/\s*loading="[^"]*"/g, '');
        let cleanAfter = after.replace(/\s*loading="[^"]*"/g, '');
        return `${cleanBefore}src="${src}"\n         srcset="${srcset}"\n         sizes="100vw" loading="lazy"${cleanAfter}`;
      } else {
        const src = cloudUrl(pid, filename);
        return `${before}src="${src}"${after}`;
      }
    }
  );

  // Replace data-full="images/..."
  html = html.replace(
    /data-full="images\/([^"]+)"/g,
    (match, filename) => {
      const pid = map[filename];
      if (!pid) return match;
      count++;
      return `data-full="${cloudUrl(pid, filename)}"`;
    }
  );

  // Replace <link rel="preload" href="images/...">
  html = html.replace(
    /href="images\/([^"]+)"/g,
    (match, filename) => {
      const pid = map[filename];
      if (!pid) return match;
      count++;
      return `href="${cloudUrl(pid, filename)}"`;
    }
  );

  if (count > 0) {
    fs.writeFileSync(file, html, 'utf8');
    console.log(`✓ ${file}: ${count} images replaced`);
  }
}

// ── Process CSS ──
const cssFile = 'css/custom.css';
let css = fs.readFileSync(cssFile, 'utf8');
let cssCount = 0;

css = css.replace(
  /url\(['"]?(?:\.\.\/)?images\/([^'")\s]+)['"]?\)/g,
  (match, filename) => {
    const pid = map[filename];
    if (!pid) {
      console.warn(`  ⚠ No CSS mapping for: ${filename}`);
      return match;
    }
    cssCount++;
    return `url('${cloudUrl(pid, filename)}')`;
  }
);

if (cssCount > 0) {
  fs.writeFileSync(cssFile, css, 'utf8');
  console.log(`✓ ${cssFile}: ${cssCount} urls replaced`);
}

console.log('\nDone!');
