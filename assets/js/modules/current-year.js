/**
 * Copyright year.
 *
 * Replaces the year written in the page (for example in the footer's
 * "© 2026 …") with the current year, so it never goes out of date.
 *
 * HTML: <p data-current-year>© 2026 Natural Aroma. All rights reserved.</p>
 */

/** @param {ParentNode} root */
export function initCurrentYear(root = document) {
  const year = String(new Date().getFullYear());
  for (const element of root.querySelectorAll('[data-current-year]')) {
    element.textContent = element.textContent.replace(/\b\d{4}\b/, year);
  }
}
