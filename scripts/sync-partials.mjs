#!/usr/bin/env node
/**
 * Copies the shared header and footer into every page.
 *
 * Each page marks where a partial goes:
 *   <!-- partial:header -->  …  <!-- /partial:header -->
 * Everything between the two markers is replaced with partials/header.html
 * (likewise for the footer), indented to match the markers. In the partials,
 * {{root}} becomes the path back to the site's main folder for that page,
 * and links to the page itself get aria-current="page" for screen readers.
 *
 * Usage (Node.js 18+):
 *   node scripts/sync-partials.mjs           update the pages
 *   node scripts/sync-partials.mjs --check   only report pages that are out of date
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { listPages, SITE_ROOT } from './lib/site.mjs';

const PARTIAL_NAMES = ['header', 'footer'];
const checkOnly = process.argv.includes('--check');

const partials = Object.fromEntries(
  await Promise.all(
    PARTIAL_NAMES.map(async (name) => {
      const source = await readFile(path.join(SITE_ROOT, 'partials', `${name}.html`), 'utf8');
      return [name, source.trimEnd()];
    }),
  ),
);

const outdated = [];

for (const page of await listPages()) {
  const original = await readFile(page.file, 'utf8');
  let html = original;

  for (const name of PARTIAL_NAMES) {
    const block = new RegExp(`^([ \\t]*)<!-- partial:${name} -->[\\s\\S]*?<!-- /partial:${name} -->`, 'm');
    html = html.replace(block, (_match, indent) => {
      const body = renderPartial(partials[name], page)
        .split('\n')
        .map((line) => (line ? indent + line : line))
        .join('\n');
      return `${indent}<!-- partial:${name} -->\n${body}\n${indent}<!-- /partial:${name} -->`;
    });
  }

  if (html === original) continue;
  outdated.push(page.relative);
  if (!checkOnly) await writeFile(page.file, html);
}

if (checkOnly) {
  if (outdated.length > 0) {
    console.error(`Out of date: ${outdated.join(', ')}. Run: node scripts/sync-partials.mjs`);
    process.exitCode = 1;
  } else {
    console.log('All pages have the current header and footer.');
  }
} else {
  console.log(outdated.length > 0 ? `Updated: ${outdated.join(', ')}` : 'Every page was already up to date.');
}

/**
 * @param {string} partial
 * @param {import('./lib/site.mjs').Page} page
 */
function renderPartial(partial, page) {
  const html = partial.replaceAll('{{root}}', page.root);
  const currentHref = page.root + currentPageTarget(page.relative);
  return html.replace(/<a ([^>]*?)href="([^"]+)"/g, (match, before, href) =>
    href === currentHref ? `<a ${before}href="${href}" aria-current="page"` : match,
  );
}

/**
 * Which navigation link represents a page: itself, or the Blog link for
 * blog posts and templates. Pages outside the menu (such as 404) match none.
 * @param {string} relative
 */
function currentPageTarget(relative) {
  if (relative.startsWith('blog/') || relative.startsWith('templates/')) return 'blog.html';
  return relative;
}
