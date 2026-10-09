/**
 * Wraps a function so it runs at most once per animation frame (with the
 * latest arguments). Used for scroll handlers, which can fire many times
 * per frame.
 *
 * @template {unknown[]} Args
 * @param {(...args: Args) => void} callback
 * @returns {(...args: Args) => void}
 */
export function rafThrottle(callback) {
  let frame = 0;
  let latestArgs;

  return (...args) => {
    latestArgs = args;
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      callback(...latestArgs);
    });
  };
}
