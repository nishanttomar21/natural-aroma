/**
 * Natural Aroma — JavaScript entry point.
 *
 * The HTML works on its own; each feature below only adds polish
 * (progressive enhancement). Features start independently, so an error in
 * one never stops the others. Every module looks for the HTML that uses it
 * (a data- attribute) and does nothing on pages without it.
 */

import { initCarousels } from './modules/carousel.js';
import { initCurrentYear } from './modules/current-year.js';
import { initFaqs } from './modules/faq.js';
import { initFeatureAccordions } from './modules/feature-accordion.js';
import { initInquiryForms } from './modules/inquiry-form.js';
import { initMobileMenu } from './modules/mobile-menu.js';
import { initReveal } from './modules/reveal.js';
import { initRollingText } from './modules/rolling-text.js';
import { initStickyHeader } from './modules/sticky-header.js';

/** Feature name → start-up function, in start-up order. */
const FEATURES = [
  ['sticky header', initStickyHeader],
  ['mobile menu', initMobileMenu],
  // Split headings into letters before they are revealed, so the change is never seen.
  ['rolling text', initRollingText],
  ['scroll reveal', initReveal],
  ['expanding cards', initFeatureAccordions],
  ['carousels', initCarousels],
  ['FAQ', initFaqs],
  ['quote form', initInquiryForms],
  ['copyright year', initCurrentYear],
];

for (const [name, init] of FEATURES) {
  try {
    init(document);
  } catch (error) {
    console.error(`[Natural Aroma] The ${name} feature failed to start.`, error);
  }
}
