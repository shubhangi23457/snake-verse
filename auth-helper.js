/**
 * auth-helper.js
 * 
 * Reusable utility functions for authentication pages (login & register).
 * Prevents code duplication and centralizes form UI helpers.
 */

/**
 * Initializes password visibility toggle logic for a given input and toggle button.
 * @param {HTMLInputElement} inputEl 
 * @param {HTMLButtonElement} toggleBtnEl 
 */
export function initPasswordToggle(inputEl, toggleBtnEl) {
  if (!inputEl || !toggleBtnEl) return;
  const eyeOpen = toggleBtnEl.querySelector('.eye-open');
  const eyeClosed = toggleBtnEl.querySelector('.eye-closed');

  toggleBtnEl.addEventListener('click', () => {
    const isPassword = inputEl.type === 'password';
    inputEl.type = isPassword ? 'text' : 'password';
    if (eyeOpen) eyeOpen.classList.toggle('hidden', !isPassword);
    if (eyeClosed) eyeClosed.classList.toggle('hidden', isPassword);
  });
}

/**
 * Displays an error message inside the error alert box and triggers a shake animation.
 * @param {HTMLElement} errorEl 
 * @param {string} message 
 */
export function showError(errorEl, message) {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  
  // Reset and trigger CSS shakeX animation
  errorEl.style.animation = 'none';
  void errorEl.offsetWidth; // Force a layout reflow
  errorEl.style.animation = 'shakeX .4s ease';
}

/**
 * Clears and hides the error alert box.
 * @param {HTMLElement} errorEl 
 */
export function clearError(errorEl) {
  if (!errorEl) return;
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

/**
 * Sets the loading state of a submit button (disables it, hides text, shows spinner).
 * @param {HTMLButtonElement} btnEl 
 * @param {boolean} loading 
 */
export function setButtonLoading(btnEl, loading) {
  if (!btnEl) return;
  btnEl.disabled = loading;
  const btnText = btnEl.querySelector('.btn-text');
  const btnSpinner = btnEl.querySelector('.btn-spinner');
  
  if (btnText) btnText.classList.toggle('hidden', loading);
  if (btnSpinner) btnSpinner.classList.toggle('hidden', !loading);
}
