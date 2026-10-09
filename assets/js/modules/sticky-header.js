/**
 * Sticky header offset.
 *
 * Publishes the header's height as the CSS variable --header-height, which
 * base.css uses as scroll-padding-top, so links to a section of the page
 * (for example about.html#mission-values) stop just below the header
 * instead of underneath it.
 */

/** @param {ParentNode} root */
export function initStickyHeader(root = document) {
  const header = root.querySelector('[data-sticky-header]');
  if (!header) return;

  const publishHeight = () => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  };

  publishHeight();
  if ('ResizeObserver' in window) {
    new ResizeObserver(publishHeight).observe(header);
  }
}
