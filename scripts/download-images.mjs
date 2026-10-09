#!/usr/bin/env node
/**
 * Saves the images that are still loaded from the original site's storage
 * into assets/images/, then points every page at the local copies.
 *
 * Run it once, before cancelling the Durable plan (those images may
 * disappear afterwards). Safe to run again: files already saved are kept,
 * and failed downloads are simply tried again.
 *
 * Usage (Node.js 18+): node scripts/download-images.mjs
 */

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { listPages, SITE_ROOT } from './lib/site.mjs';

/** Where the original site stores its images. */
const REMOTE_HOST = 'https://rjdavx8ozyznxeyh.public.blob.vercel-storage.com/';
const IMAGES_FOLDER = 'assets/images';

/** Readable file names, keyed by the start of the remote file name. */
const FILE_NAMES = {
  '863523c6': 'quality-check.png',
  '04d8a4fb': 'technician-inspection.png',
  '873ac7ca': 'order-review.png',
  f07c187c: 'spice-oil-bottles.png',
  '749dd67b': 'portrait-production-lead.png',
  d81b269c: 'portrait-quality-advisor.png',
  '62b24a2c': 'portrait-director.png',
  '60cf4b67': 'portrait-procurement-head.png',
  '955ca6ca': 'portrait-formulation-lead.png',
  43692217: 'portrait-operations-director.png',
  1242: 'logo-aromatherapy.png',
  1224: 'logo-spice-processing.png',
  1037: 'logo-personal-care.png',
  1032: 'logo-cosmetics-lab.png',
  1021: 'logo-fragrance.png',
  1012: 'logo-food-ingredients.png',
  926: 'logo-pharmaceutical.png',
  922: 'logo-home-care.png',
};

const pages = await listPages();
const pageHtml = new Map(await Promise.all(pages.map(async (page) => [page, await readFile(page.file, 'utf8')])));

const remoteUrlPattern = new RegExp(`${REMOTE_HOST.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}[^"'\\s)]+`, 'g');
const remoteUrls = new Set();
for (const html of pageHtml.values()) {
  for (const match of html.matchAll(remoteUrlPattern)) remoteUrls.add(match[0]);
}

if (remoteUrls.size === 0) {
  console.log('Nothing to do: every image is already stored in assets/images.');
  process.exit(0);
}

await mkdir(path.join(SITE_ROOT, IMAGES_FOLDER), { recursive: true });

/** Remote address → local file name, for the downloads that worked. */
const saved = new Map();

for (const url of remoteUrls) {
  const fileName = localNameFor(url);
  const destination = path.join(SITE_ROOT, IMAGES_FOLDER, fileName);
  try {
    if (!(await exists(destination))) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(destination, bytes);
      console.log(`✓ ${fileName} (${Math.round(bytes.length / 1024)} KB)`);
    } else {
      console.log(`✓ ${fileName} (already saved)`);
    }
    saved.set(url, fileName);
  } catch (error) {
    console.error(`✗ ${fileName}: ${error.message}`);
  }
}

for (const [page, original] of pageHtml) {
  let html = original;
  for (const [url, fileName] of saved) {
    html = html.replaceAll(url, `${page.root}${IMAGES_FOLDER}/${fileName}`);
  }
  if (html !== original) await writeFile(page.file, html);
}

const failed = remoteUrls.size - saved.size;
console.log(failed === 0 ? '\nDone: every page now uses the local images.' : `\n${failed} download(s) failed. Run the script again to retry.`);
process.exitCode = failed === 0 ? 0 : 1;

/** @param {string} url */
function localNameFor(url) {
  const remoteName = url.slice(url.lastIndexOf('/') + 1);
  const key = Object.keys(FILE_NAMES).find((prefix) => remoteName.startsWith(`${prefix}-`) || remoteName.startsWith(`${prefix}.`));
  return key ? FILE_NAMES[key] : remoteName;
}

/** @param {string} file */
async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
