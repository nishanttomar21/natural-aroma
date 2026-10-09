/**
 * Expanding cards (desktop).
 *
 * A row of numbered cards where one is open and the others are narrow
 * strips. Hovering with a mouse, clicking, tapping or moving keyboard focus
 * onto a card opens it (the widths animate in CSS, see sections.css).
 *
 * HTML: <div data-feature-accordion>
 *         <div data-feature-panel class="is-active"><button aria-expanded="true">…</button></div>
 *         …
 *       </div>
 */

const ACTIVE_CLASS = 'is-active';

/** @param {ParentNode} root */
export function initFeatureAccordions(root = document) {
  for (const accordion of root.querySelectorAll('[data-feature-accordion]')) {
    enhanceAccordion(accordion);
  }
}

/** @param {Element} accordion */
function enhanceAccordion(accordion) {
  const panels = [...accordion.querySelectorAll('[data-feature-panel]')];

  const activate = (activeIndex) => {
    panels.forEach((panel, index) => {
      const isActive = index === activeIndex;
      panel.classList.toggle(ACTIVE_CLASS, isActive);
      panel.querySelector('button')?.setAttribute('aria-expanded', String(isActive));
    });
  };

  panels.forEach((panel, index) => {
    const button = panel.querySelector('button');
    if (!button) return;

    button.addEventListener('click', () => activate(index));
    button.addEventListener('focus', () => activate(index));
    button.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') activate(index);
    });
  });
}
