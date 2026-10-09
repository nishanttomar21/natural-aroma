/**
 * Mobile menu.
 *
 * The menu is a <details> element, so it already opens and closes without
 * JavaScript. This adds what visitors expect from a menu: it closes with
 * the Escape key, with a click or tap outside it, after choosing a link,
 * and when the screen becomes wide enough to show the full navigation.
 *
 * HTML: <details data-mobile-menu><summary>…</summary><nav>…</nav></details>
 */

// Same breakpoint as the CSS that hides the menu button on tablets and up.
const WIDE_SCREEN = window.matchMedia('(width > 40rem)');

/** @param {ParentNode} root */
export function initMobileMenu(root = document) {
  for (const menu of root.querySelectorAll('details[data-mobile-menu]')) {
    enhanceMenu(menu);
  }
}

/** @param {HTMLDetailsElement} menu */
function enhanceMenu(menu) {
  const toggle = menu.querySelector('summary');

  const close = ({ restoreFocus = false } = {}) => {
    if (!menu.open) return;
    menu.open = false;
    if (restoreFocus) toggle?.focus();
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close({ restoreFocus: true });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!menu.contains(/** @type {Node} */ (event.target))) close();
  });

  menu.addEventListener('click', (event) => {
    if (/** @type {Element} */ (event.target).closest('a')) close();
  });

  WIDE_SCREEN.addEventListener('change', (event) => {
    if (event.matches) close();
  });
}
