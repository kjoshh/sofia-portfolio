#!/usr/bin/env node
/**
 * migrate-to-sanity.js — One-time migration of existing data to Sanity
 *
 * Uploads all project images, archive images, and settings to Sanity.
 * Uses the existing Cloudinary public IDs and uploads the optimized
 * Cloudinary URLs as external image assets.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = '4g1grp0d';
const DATASET = 'production';
const TOKEN = 'skHUsETPuYwmlhxqiyG4XDtsc2A9e6hk30KMbs7Wkrup3PBDlgrrKXVQSOMHmXV5UCUI85oBR0iNTq0Wy';
const CLOUD = 'dnvwadmaj';

const API = `https://${PROJECT_ID}.api.sanity.io/v2021-06-07/`;

// ── HTTP helpers ──

function sanityFetch(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API);
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data || '{}'));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function downloadBuffer(imageUrl) {
  return new Promise((resolve, reject) => {
    https.get(imageUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function uploadImageFromUrl(imageUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const buf = await downloadBuffer(imageUrl);
      const url = new URL(`/v2021-06-07/assets/images/${DATASET}`, `https://${PROJECT_ID}.api.sanity.io`);
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'image/jpeg',
          'Content-Length': buf.length,
        },
      };
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`Upload failed ${res.statusCode}: ${data}`));
          } else {
            resolve(JSON.parse(data).document);
          }
        });
      });
      req.on('error', reject);
      req.write(buf);
      req.end();
    } catch (err) { reject(err); }
  });
}

function mutate(mutations) {
  return sanityFetch('POST', `data/mutate/${DATASET}`, { mutations });
}

function cloudUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto/${publicId}.jpg`;
}

// ── Migration ──

async function uploadImage(publicId, label) {
  const url = cloudUrl(publicId);
  console.log(`    Uploading ${label || publicId}...`);
  const asset = await uploadImageFromUrl(url);
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: asset._id },
  };
}

async function migrateProjects() {
  const dir = path.join(__dirname, '_data', 'projects');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    console.log(`\n  Project: ${data.title}`);

    // Upload thumbnail
    const thumbnail = await uploadImage(data.thumbnail, 'thumbnail');

    // Upload gallery images
    const gallery = [];
    for (let i = 0; i < data.gallery.length; i++) {
      const img = await uploadImage(data.gallery[i], `image ${i + 1}/${data.gallery.length}`);
      gallery.push({ ...img, _key: `img${i}` });
    }

    // Parse info text
    const infoText = Array.isArray(data.info_text)
      ? data.info_text.join('\n\n')
      : String(data.info_text || '');

    await mutate([{
      createOrReplace: {
        _type: 'project',
        _id: `project-${data.slug}`,
        title: data.title,
        slug: { _type: 'slug', current: data.slug },
        thumbnail,
        gallery,
        infoText,
        sortOrder: data.sort_order || 0,
      },
    }]);
    console.log(`  ✓ ${data.title} created`);
  }
}

async function migrateArchive() {
  const file = path.join(__dirname, '_data', 'archive.json');
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));

  console.log(`\n  Archive: ${items.length} images`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const image = await uploadImage(item.image, `archive ${i + 1}/${items.length}`);

    await mutate([{
      createOrReplace: {
        _type: 'archiveImage',
        _id: `archive-${i + 1}`,
        image,
        isBw: item.is_bw || false,
        sortOrder: item.sort_order || i + 1,
      },
    }]);
  }
  console.log(`  ✓ ${items.length} archive images created`);
}

async function migrateSettings() {
  const file = path.join(__dirname, '_data', 'settings.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  console.log('\n  Settings');

  let aboutHero;
  if (data.about_hero) {
    aboutHero = await uploadImage(data.about_hero, 'about hero');
  }

  await mutate([{
    createOrReplace: {
      _type: 'siteSettings',
      _id: 'siteSettings',
      greetingLine1: data.greeting_line1,
      greetingLine2: data.greeting_line2,
      aboutHero,
    },
  }]);
  console.log('  ✓ Settings created');
}

async function main() {
  console.log('Migrating to Sanity...\n');
  await migrateProjects();
  await migrateArchive();
  await migrateSettings();
  console.log('\n✓ Migration complete!');
}

main().catch(err => { console.error(err); process.exit(1); });
