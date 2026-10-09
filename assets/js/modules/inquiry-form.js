/**
 * Quote request form.
 *
 * Without JavaScript the form is an ordinary form post to the address in
 * its action attribute (a Formspree form; see README). This sends it in
 * the background instead, so the visitor stays on the page and sees the
 * result under the form.
 *
 * HTML: <form data-inquiry-form data-fallback-phone="…" action="https://formspree.io/f/…">…</form>
 *       <p data-form-status role="status"></p>   (next to the form)
 */

/** Text in the form's action until the site owner connects their own form. */
const UNCONFIGURED_MARKER = 'YOUR_FORM_ID';

const REQUEST_TIMEOUT_MS = 15_000;

const MESSAGES = {
  sending: 'Sending…',
  success: "Thank you. We've received your requirement and will reply within one business day.",
  failure: (phone) => `Sorry, we couldn't send your request. Please call us on ${phone}.`,
};

/** @param {ParentNode} root */
export function initInquiryForms(root = document) {
  for (const form of root.querySelectorAll('form[data-inquiry-form]')) {
    enhanceForm(/** @type {HTMLFormElement} */ (form));
  }
}

/** @param {HTMLFormElement} form */
function enhanceForm(form) {
  const status = form.parentElement?.querySelector('[data-form-status]');
  const submitButton = /** @type {HTMLButtonElement | null} */ (form.querySelector('[type="submit"]'));
  const buttonLabel = submitButton?.querySelector('.btn__label') ?? submitButton;
  const idleLabel = buttonLabel?.textContent ?? '';
  const fallbackPhone = form.dataset.fallbackPhone ?? '';

  const showStatus = (message, state) => {
    if (!status) return;
    status.textContent = message;
    status.setAttribute('data-state', state);
  };

  const setSending = (isSending) => {
    if (!submitButton || !buttonLabel) return;
    submitButton.disabled = isSending;
    buttonLabel.textContent = isSending ? MESSAGES.sending : idleLabel;
  };

  // The browser has already checked required fields and email format before this runs.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showStatus('', 'idle');

    if (form.action.includes(UNCONFIGURED_MARKER)) {
      console.warn('[Natural Aroma] The quote form is not connected yet. Put your Formspree form address in its action attribute (see README).');
      showStatus(MESSAGES.failure(fallbackPhone), 'error');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`The form service answered with HTTP ${response.status}.`);

      form.reset();
      showStatus(MESSAGES.success, 'success');
    } catch (error) {
      console.error('[Natural Aroma] Sending the quote form failed.', error);
      showStatus(MESSAGES.failure(fallbackPhone), 'error');
    } finally {
      setSending(false);
    }
  });
}
