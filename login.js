/**
 * login.js – Handles the LOGIN page logic.
 *
 * What it does:
 *  1. If a user is already signed in, redirect them to the dashboard/game.
 *  2. Submit the login form → call Supabase sign-in.
 *  3. Show loading spinner while waiting.
 *  4. On success → go to redirect parameter or game.html.
 *  5. On error → show a friendly message.
 *  6. Toggle password visibility.
 */

import { supabase } from './supabase-client.js';
import { initPasswordToggle, showError, clearError, setButtonLoading } from './auth-helper.js';

// Get redirect URL from query parameters
const params = new URLSearchParams(window.location.search);
const redirectUrl = params.get('redirect') || 'index.html';

// ── DOM references ─────────────────────────────────────────────────────────────
const loginForm  = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const errorEl    = document.getElementById('login-error');
const loginBtn   = document.getElementById('login-btn');
const toggleBtn  = document.querySelector('.password-toggle');

// Initialize password visibility toggle
initPasswordToggle(passInput, toggleBtn);

// ── Form submit ───────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError(errorEl);

  const email    = emailInput.value.trim();
  const password = passInput.value;

  // Basic front-end validation
  if (!email || !password) {
    showError(errorEl, 'Please fill in both email and password.');
    return;
  }

  setButtonLoading(loginBtn, true);

  // Call Supabase email+password sign-in
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    setButtonLoading(loginBtn, false);
    // Map Supabase error codes to friendly messages
    const msg = error.message.includes('Invalid login')
      ? 'Incorrect email or password. Please try again.'
      : error.message;
    showError(errorEl, msg);
    return;
  }

  // Success – navigate to the redirect URL or game page
  window.location.href = redirectUrl;
});