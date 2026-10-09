/**
 * Rolling letters.
 *
 * Splits a heading marked data-rolling-text into individual letters. When
 * the mouse passes over a letter it rolls up and an identical copy rolls
 * in from below (styles in motion.css). Screen readers get the plain text
 * from a visually hidden copy; the letters themselves are hidden from them.
 */

import { prefersReducedMotion } from '../utils/motion.js';

const ROLLING_CLASS = 'is-rolling';
const RESETTING_CLASS = 'is-resetting';

/** Safety net in case the transitionend event never arrives. */
const RESET_FALLBACK_MS = 600;

/** @param {ParentNode} root */
export function initRollingText(root = document) {
  for (const heading of root.querySelectorAll('[data-rolling-text]')) {
    splitIntoLetters(heading);
    heading.addEventListener('pointerover', handlePointerOver);
  }
}

/** @param {Element} heading */
function splitIntoLetters(heading) {
  const text = heading.textContent.trim().replace(/\s+/g, ' ');
  const fragment = document.createDocumentFragment();

  fragment.append(createSpan('sr-only', text));

  text.split(' ').forEach((word, index) => {
    if (index > 0) fragment.append(createSpan('rolling-text__space', ' ', { hidden: true }));

    const wordElement = createSpan('rolling-text__word', '', { hidden: true });
    for (const character of word) {
      const letter = createSpan('rolling-text__letter');
      letter.append(createSpan('rolling-text__glyph', character), createSpan('rolling-text__copy', character));
      wordElement.append(letter);
    }
    fragment.append(wordElement);
  });

  heading.replaceChildren(fragment);
}

/** @param {PointerEvent} event */
function handlePointerOver(event) {
  // Hover is a mouse or pen gesture; ignore touches and respect reduced motion.
  if (event.pointerType === 'touch' || prefersReducedMotion()) return;

  const letter = /** @type {Element} */ (event.target).closest('.rolling-text__letter');
  if (letter && !letter.classList.contains(ROLLING_CLASS)) roll(letter);
}

/** @param {Element} letter */
function roll(letter) {
  letter.classList.add(ROLLING_CLASS);

  let isReset = false;
  const reset = () => {
    if (isReset) return;
    isReset = true;
    // Jump both copies back without animating; they show the same glyph, so nothing visibly moves.
    letter.classList.add(RESETTING_CLASS);
    letter.classList.remove(ROLLING_CLASS);
    void /** @type {HTMLElement} */ (letter).offsetWidth; // apply the jump before transitions return
    letter.classList.remove(RESETTING_CLASS);
  };

  letter.firstElementChild?.addEventListener('transitionend', reset, { once: true });
  window.setTimeout(reset, RESET_FALLBACK_MS);
}

/**
 * @param {string} className
 * @param {string} [text]
 * @param {{ hidden?: boolean }} [options] hidden: hide from screen readers
 */
function createSpan(className, text = '', { hidden = false } = {}) {
  const span = document.createElement('span');
  span.className = className;
  if (text) span.textContent = text;
  if (hidden) span.setAttribute('aria-hidden', 'true');
  return span;
}
