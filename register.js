/**
 * register.js – Handles the SIGN-UP/REGISTER page logic.
 *
 * What it does:
 *  1. If already logged in → redirect to redirectUrl or game.
 *  2. Show a password-strength indicator as the user types.
 *  3. On form submit → call Supabase signUp.
 *  4. On success → redirect to redirectUrl.
 */

import { supabase } from './supabase-client.js';
import { initPasswordToggle, showError, clearError, setButtonLoading } from './auth-helper.js';

// Get redirect URL from query parameters
const params = new URLSearchParams(window.location.search);
const redirectUrl = params.get('redirect') || 'index.html';

// ── DOM references ─────────────────────────────────────────────────────────────
const signupForm   = document.getElementById('signup-form');
const nameInput    = document.getElementById('full-name');
const emailInput   = document.getElementById('email');
const passInput    = document.getElementById('password');
const errorEl      = document.getElementById('signup-error');
const signupBtn    = document.getElementById('signup-btn');
const strengthBar  = document.querySelectorAll('.strength-segment');
const strengthLabel = document.getElementById('strength-label');
const toggleBtn    = document.querySelector('.password-toggle');

// Initialize password visibility toggle
initPasswordToggle(passInput, toggleBtn);

// ── Password strength meter ────────────────────────────────────────────────────
// Returns a score 0–4 based on simple heuristics.
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6)  score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthColors = ['#fc8181', '#f6ad55', '#ecc94b', '#48bb78'];
const strengthTexts  = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

passInput.addEventListener('input', () => {
  const score = getPasswordStrength(passInput.value);

  // Color each segment
  strengthBar.forEach((seg, idx) => {
    seg.style.background = idx < score ? strengthColors[score - 1] : 'var(--line-soft)';
  });

  // Label
  strengthLabel.textContent = passInput.value.length > 0 ? strengthTexts[score] : '';
  strengthLabel.style.color = score > 0 ? strengthColors[score - 1] : 'var(--ink-dimmer)';
});

// ── Form submit ────────────────────────────────────────────────────────────────
signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(errorEl);

  const name     = nameInput.value.trim();
  const email    = emailInput.value.trim();
  const password = passInput.value;

  // Validate
  if (!name || !email || !password) {
    showError(errorEl, 'Please fill in all fields.');
    return;
  }
  if (password.length < 6) {
    showError(errorEl, 'Password must be at least 6 characters.');
    return;
  }

  setButtonLoading(signupBtn, true);

  // Call Supabase sign-up.
  // We pass the full name as user_metadata so it can be used later.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    setButtonLoading(signupBtn, false);
    // Show a readable error
    const msg = error.message.includes('already registered')
      ? 'This email is already in use. Try signing in instead.'
      : error.message;
    showError(errorEl, msg);
    return;
  }

  // Success – go to redirectUrl or game page
  window.location.href = redirectUrl;
});