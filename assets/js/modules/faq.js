/**
 * FAQ answers.
 *
 * Each question is a <details> element, so answers open without
 * JavaScript, and the browser keeps one open at a time (the shared "name"
 * attribute). This adds the smooth open/close animation of the original;
 * because the browser would close the previous answer instantly, this
 * module takes over keeping one answer open, and animates both.
 *
 * HTML: <div data-faq>
 *         <details name="…"><summary>Question</summary><div data-faq-content>Answer</div></details>
 *         …
 *       </div>
 */

import { prefersReducedMotion } from '../utils/motion.js';

const ANIMATION = { duration: 200, easing: 'ease-out' };
const CLOSING_CLASS = 'is-closing';

/** The animation currently running on each answer, so a new one can take over smoothly. */
const runningAnimations = new WeakMap();

/** @param {ParentNode} root */
export function initFaqs(root = document) {
  for (const faq of root.querySelectorAll('[data-faq]')) {
    enhanceFaq(faq);
  }
}

/** @param {Element} faq */
function enhanceFaq(faq) {
  const items = /** @type {HTMLDetailsElement[]} */ ([...faq.querySelectorAll('details')]);

  for (const item of items) {
    item.removeAttribute('name'); // this module now keeps one answer open at a time
    item.querySelector('summary')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isOpen(item)) {
        collapse(item);
      } else {
        items.filter((other) => other !== item && isOpen(other)).forEach(collapse);
        expand(item);
      }
    });
  }
}

/** Open and not already on its way to closing. @param {HTMLDetailsElement} item */
function isOpen(item) {
  return item.open && !item.classList.contains(CLOSING_CLASS);
}

/** @param {HTMLDetailsElement} item */
function expand(item) {
  const content = contentOf(item);
  const startHeight = stopAnimation(content) ?? 0;

  item.classList.remove(CLOSING_CLASS);
  item.open = true;
  if (prefersReducedMotion() || !content) return;

  animateHeight(content, startHeight, content.scrollHeight);
}

/** @param {HTMLDetailsElement} item */
function collapse(item) {
  const content = contentOf(item);
  if (prefersReducedMotion() || !content) {
    item.open = false;
    return;
  }

  const startHeight = stopAnimation(content) ?? content.offsetHeight;
  item.classList.add(CLOSING_CLASS);
  animateHeight(content, startHeight, 0).addEventListener('finish', () => {
    item.open = false;
    item.classList.remove(CLOSING_CLASS);
  });
}

/** @param {HTMLDetailsElement} item */
function contentOf(item) {
  return /** @type {HTMLElement | null} */ (item.querySelector('[data-faq-content]'));
}

/**
 * Stops a running animation and returns the height it had reached
 * (or undefined when nothing was running).
 * @param {HTMLElement | null} content
 */
function stopAnimation(content) {
  const animation = content && runningAnimations.get(content);
  if (!animation) return undefined;
  const height = content.getBoundingClientRect().height;
  animation.cancel();
  runningAnimations.delete(content);
  return height;
}

/**
 * @param {HTMLElement} content
 * @param {number} from
 * @param {number} to
 */
function animateHeight(content, from, to) {
  const animation = content.animate([{ height: `${from}px` }, { height: `${to}px` }], ANIMATION);
  runningAnimations.set(content, animation);
  animation.addEventListener('finish', () => runningAnimations.delete(content));
  return animation;
}
