/**
 * Carousels.
 *
 * The slides sit in a horizontally scrolling track that snaps one slide at
 * a time (CSS), so swiping and trackpads work without JavaScript. This adds:
 *   - the dots: they show the current slide and jump to a slide when clicked
 *   - dragging with a mouse
 *   - Left/Right arrow keys while focus is inside the carousel
 *
 * HTML: <div data-carousel>
 *         <div data-carousel-track> <div>slide</div> … </div>
 *         <button data-carousel-dot="0"></button> …   (dots may also live inside slides)
 *       </div>
 */

import { rafThrottle } from '../utils/raf-throttle.js';
import { scrollBehavior } from '../utils/motion.js';

/** Share of a slide to drag before letting go moves to the next one. */
const DRAG_THRESHOLD = 0.15;

/** Pixels the mouse must move before a press counts as a drag (not a click). */
const DRAG_START_DISTANCE = 4;

/** Safety net for browsers without the scrollend event. */
const SETTLE_FALLBACK_MS = 700;

const DRAGGING_CLASS = 'is-dragging';

/** @param {ParentNode} root */
export function initCarousels(root = document) {
  for (const element of root.querySelectorAll('[data-carousel]')) {
    const track = element.querySelector('[data-carousel-track]');
    if (track && track.children.length > 0) new Carousel(element, track);
  }
}

class Carousel {
  /**
   * @param {HTMLElement} root
   * @param {HTMLElement} track
   */
  constructor(root, track) {
    this.root = root;
    this.track = track;
    this.slides = /** @type {HTMLElement[]} */ ([...track.children]);
    this.dots = /** @type {HTMLElement[]} */ ([...root.querySelectorAll('[data-carousel-dot]')]);
    this.index = -1;
    this.suppressClick = false;

    this.track.addEventListener('scroll', rafThrottle(() => this.syncIndex()), { passive: true });
    this.track.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    this.track.addEventListener('dragstart', (event) => event.preventDefault());
    this.root.addEventListener('click', (event) => this.handleClick(event), { capture: true });
    this.root.addEventListener('keydown', (event) => this.handleKeyDown(event));

    this.syncIndex();
  }

  /** Distance between the starts of two neighbouring slides (slide width + gap). */
  get step() {
    const [first, second] = this.slides;
    return second ? second.offsetLeft - first.offsetLeft : this.track.clientWidth;
  }

  /** @param {number} index */
  clamp(index) {
    return Math.min(Math.max(index, 0), this.slides.length - 1);
  }

  /** Works out which slide is showing and updates the dots to match. */
  syncIndex() {
    const index = this.clamp(Math.round(this.track.scrollLeft / this.step));
    if (index === this.index) return;
    this.index = index;

    for (const dot of this.dots) {
      if (Number(dot.dataset.carouselDot) === index) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    }
  }

  /**
   * Scrolls to a slide. The dots update from the scroll position.
   * @param {number} index
   */
  goTo(index) {
    const target = this.slides[this.clamp(index)];
    this.track.scrollTo({ left: target.offsetLeft - this.slides[0].offsetLeft, behavior: scrollBehavior() });
  }

  /**
   * Keeps keyboard focus on a visible dot. In carousels with a row of dots
   * inside every slide, focus moves to the same dot in the new slide, so the
   * next Tab doesn't jump to a slide that has scrolled out of view.
   * @param {number} index
   */
  moveFocusTo(index) {
    if (!this.root.contains(document.activeElement)) return;
    const slide = this.slides[index];
    const dot =
      slide.querySelector(`[data-carousel-dot="${index}"]`) ??
      this.dots.find((candidate) => Number(candidate.dataset.carouselDot) === index);
    dot?.focus({ preventScroll: true });
  }

  /** @param {MouseEvent} event */
  handleClick(event) {
    // A drag ends with a click on whatever is under the mouse; ignore it.
    if (this.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const dot = /** @type {Element} */ (event.target).closest('[data-carousel-dot]');
    if (!dot) return;
    const index = this.clamp(Number(/** @type {HTMLElement} */ (dot).dataset.carouselDot));
    this.goTo(index);
    this.moveFocusTo(index);
  }

  /** @param {KeyboardEvent} event */
  handleKeyDown(event) {
    const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    const index = this.clamp(this.index + direction);
    this.goTo(index);
    this.moveFocusTo(index);
  }

  /** Mouse dragging (touch screens already swipe natively). @param {PointerEvent} event */
  handlePointerDown(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    const startX = event.clientX;
    const startScroll = this.track.scrollLeft;
    const startIndex = this.index;
    let isDragging = false;

    const handleMove = (/** @type {PointerEvent} */ moveEvent) => {
      const distance = moveEvent.clientX - startX;
      if (!isDragging) {
        if (Math.abs(distance) < DRAG_START_DISTANCE) return;
        isDragging = true;
        this.track.classList.add(DRAGGING_CLASS); // pauses snapping while the mouse moves the track
        this.track.setPointerCapture(event.pointerId);
      }
      this.track.scrollLeft = startScroll - distance;
    };

    const handleRelease = (/** @type {PointerEvent} */ upEvent) => {
      this.track.removeEventListener('pointermove', handleMove);
      this.track.removeEventListener('pointerup', handleRelease);
      this.track.removeEventListener('pointercancel', handleRelease);
      if (!isDragging) return;

      const distance = upEvent.clientX - startX;
      const threshold = this.step * DRAG_THRESHOLD;
      let target = startIndex;
      if (distance <= -threshold) target = startIndex + 1;
      else if (distance >= threshold) target = startIndex - 1;

      this.settleOn(target);
      this.suppressClick = true;
      window.setTimeout(() => {
        this.suppressClick = false;
      }, 0);
    };

    this.track.addEventListener('pointermove', handleMove);
    this.track.addEventListener('pointerup', handleRelease);
    this.track.addEventListener('pointercancel', handleRelease);
  }

  /**
   * Glides to a slide after a drag, turning snapping back on only once the
   * track has arrived (turning it on earlier would make the track jump).
   * @param {number} index
   */
  settleOn(index) {
    let isSettled = false;
    const finish = () => {
      if (isSettled) return;
      isSettled = true;
      this.track.classList.remove(DRAGGING_CLASS);
    };

    this.track.addEventListener('scrollend', finish, { once: true });
    window.setTimeout(finish, SETTLE_FALLBACK_MS);
    this.goTo(index);
  }
}
