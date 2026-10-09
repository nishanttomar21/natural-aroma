/**
 * Shared helpers for the maintenance scripts: finding the site's pages and
 * working out the path from each page back to the site's main folder.
 */

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The site's main folder (the one containing index.html). */
export const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Where the site lives on its web address:
 *   '/natural-aroma/'  on GitHub Pages (https://nishanttomar21.github.io/natural-aroma/)
 *   '/'                on its own domain (for example https://www.naturalaroma.in/)
 * Only the 404 page needs it (see below). If you change it, also update the
 * paths in 404.html's <head>, then run this script.
 */
export const SITE_BASE_PATH = '/natural-aroma/';

/** Folders (besides the main one) whose .html files are pages. */
const PAGE_FOLDERS = ['blog', 'templates'];

/**
 * Pages that hosts show for any missing address (for example /blog/old/post),
 * so their links must start from the site's base path rather than be relative.
 */
const BASE_PATH_RELATIVE_PAGES = new Set(['404.html']);

/**
 * @typedef {object} Page
 * @property {string} file      absolute path on disk
 * @property {string} relative  path from the main folder, e.g. "blog/my-post.html"
 * @property {string} root      prefix that leads back to the main folder: "", "../" or SITE_BASE_PATH
 */

/** @returns {Promise<Page[]>} every page, main folder first */
export async function listPages() {
  const pages = [];
  for (const folder of ['', ...PAGE_FOLDERS]) {
    const directory = path.join(SITE_ROOT, folder);
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      continue; // folder doesn't exist (e.g. no blog posts yet)
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const relative = folder ? `${folder}/${entry.name}` : entry.name;
      pages.push({ file: path.join(directory, entry.name), relative, root: rootFor(relative) });
    }
  }
  return pages.sort((a, b) => a.relative.localeCompare(b.relative));
}

/** @param {string} relative */
function rootFor(relative) {
  if (BASE_PATH_RELATIVE_PAGES.has(relative)) return SITE_BASE_PATH;
  const depth = relative.split('/').length - 1;
  return '../'.repeat(depth);
}
