/**
 * Scroll reveal.
 *
 * Elements marked data-reveal="fade-up" or data-reveal="scale-in" start
 * hidden (see motion.css) and animate in the first time they scroll into
 * view. Adding the "is-revealed" class plays the CSS transition.
 */

const REVEALED_CLASS = 'is-revealed';

/** Trigger slightly before the element's top reaches the bottom of the screen. */
const OBSERVER_OPTIONS = { rootMargin: '0px 0px -10% 0px', threshold: 0.1 };

/** @param {ParentNode} root */
export function initReveal(root = document) {
  const elements = [...root.querySelectorAll('[data-reveal]')];
  if (elements.length === 0) return;

  // Very old browsers: show everything straight away.
  if (!('IntersectionObserver' in window)) {
    elements.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal(entry.target);
      observer.unobserve(entry.target);
    }
  }, OBSERVER_OPTIONS);

  elements.forEach((element) => observer.observe(element));
}

/** @param {Element} element */
function reveal(element) {
  element.classList.add(REVEALED_CLASS);
}
