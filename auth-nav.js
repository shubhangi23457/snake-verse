/**
 * auth-nav.js
 *
 * Global authentication check and page guard.
 * Loaded on all pages as a module.
 */

import { supabase } from './supabase-client.js';

async function initAuth() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
  // Define protected and auth pages
  const authPages = ['login.html', 'register.html'];
  const isAuthPage = authPages.includes(currentPath);

  // Fetch the current user session
  let user = null;
  try {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    user = supabaseUser;
  } catch (err) {
    console.error('Error verifying auth session:', err);
  }

  // Handle route guards
  if (!isAuthPage && !user) {
    // Redirect unauthenticated user to login with return path
    const redirectParam = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `login.html?redirect=${redirectParam}`;
    return;
  }

  if (isAuthPage && user) {
    // Redirect authenticated user away from login/register to Home
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect') || 'index.html';
    window.location.href = redirectUrl;
    return;
  }

  // If authenticated on a protected page, remove anti-flash block
  if (!isAuthPage && user) {
    const antiFlash = document.getElementById('anti-flash');
    if (antiFlash) {
      antiFlash.remove();
    }
  }

  // Update navigation menu
  const navLinks = document.getElementById('navLinks');
  const navToggle = document.getElementById('navToggle');

  if (!user) {
    // Hide navigation links and mobile toggle entirely before login
    if (navLinks) navLinks.style.display = 'none';
    if (navToggle) navToggle.style.display = 'none';
  } else {
    // Show navigation links and mobile toggle after login
    if (navLinks) {
      navLinks.style.display = '';
      if (navToggle) navToggle.style.display = '';

      // Clear any existing auth nav items to prevent duplicates
      const existingEmailItem = document.getElementById('auth-email-item');
      const existingLogoutItem = document.getElementById('auth-logout-item');
      if (existingEmailItem) existingEmailItem.remove();
      if (existingLogoutItem) existingLogoutItem.remove();

      // Create user email menu item
      const emailLi = document.createElement('li');
      emailLi.id = 'auth-email-item';
      emailLi.style.display = 'inline-flex';
      emailLi.style.alignItems = 'center';
      emailLi.style.padding = '0 12px';
      
      const emailSpan = document.createElement('span');
      emailSpan.style.fontFamily = "'JetBrains Mono', monospace";
      emailSpan.style.fontSize = '12px';
      emailSpan.style.color = 'var(--gold)';
      emailSpan.style.border = '1px solid var(--line-soft)';
      emailSpan.style.padding = '4px 10px';
      emailSpan.style.borderRadius = '14px';
      emailSpan.style.background = 'var(--surface-2)';
      emailSpan.textContent = user.email;
      
      emailLi.appendChild(emailSpan);

      // Create logout item
      const logoutLi = document.createElement('li');
      logoutLi.id = 'auth-logout-item';
      const logoutA = document.createElement('a');
      logoutA.href = '#';
      logoutA.textContent = 'Logout';
      logoutA.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await supabase.auth.signOut();
          window.location.href = 'login.html';
        } catch (err) {
          console.error('Error logging out:', err);
        }
      });
      logoutLi.appendChild(logoutA);

      // Append items
      navLinks.appendChild(emailLi);
      navLinks.appendChild(logoutLi);
    }
  }
}

// Execute logic
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
