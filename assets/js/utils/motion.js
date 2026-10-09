/**
 * Helpers for respecting the visitor's "reduce motion" setting.
 */

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/** True when the visitor has asked their device to minimise animation. */
export function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

/** Scroll behaviour for element.scrollTo(): instant when motion is reduced. */
export function scrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}
