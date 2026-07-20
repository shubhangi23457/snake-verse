/**
 * auth-nav.js
 *
 * Global authentication check and page guard.
 * Supports both Supabase authenticated users and Guest mode.
 * Loaded on all pages as a module.
 */

import { supabase } from './supabase-client.js';

function getNormalizedPath(pathname) {
  const file = pathname.split('/').pop() || 'index.html';
  return file.replace(/\.html$/, '');
}

async function initAuth() {
  const cleanPath = getNormalizedPath(window.location.pathname);
  
  // Define protected and auth pages
  const authPages = ['login', 'register'];
  const isAuthPage = authPages.includes(cleanPath);

  // Fetch the current user session
  let user = null;
  try {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    user = supabaseUser;
  } catch (err) {
    console.error('Error verifying auth session:', err);
  }

  const isGuestMode = localStorage.getItem('snakeverse_guest_mode') === 'true';
  const isAuthorized = user || isGuestMode;

  // Handle route guards
  if (!isAuthPage && !isAuthorized) {
    // Redirect unauthenticated user to login with return path
    const redirectParam = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `login.html?redirect=${redirectParam}`;
    return;
  }

  if (isAuthPage && isAuthorized) {
    // Redirect authenticated or guest user away from login/register to Home or requested URL
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect') || 'index.html';
    window.location.href = redirectUrl;
    return;
  }

  // If authorized on a protected page, remove anti-flash block
  if (!isAuthPage && isAuthorized) {
    const antiFlash = document.getElementById('anti-flash');
    if (antiFlash) {
      antiFlash.remove();
    }
  }

  // Update navigation menu
  const navLinks = document.getElementById('navLinks');
  const navToggle = document.getElementById('navToggle');

  if (!isAuthorized) {
    // Hide navigation links and mobile toggle before login/guest access
    if (navLinks) navLinks.style.display = 'none';
    if (navToggle) navToggle.style.display = 'none';
  } else {
    // Show navigation links and mobile toggle after login/guest access
    if (navLinks) {
      navLinks.style.display = '';
      if (navToggle) navToggle.style.display = '';

      // Clear any existing auth nav items to prevent duplicates
      const existingEmailItem = document.getElementById('auth-email-item');
      const existingGuestItem = document.getElementById('auth-guest-item');
      const existingSigninItem = document.getElementById('auth-signin-item');
      const existingLogoutItem = document.getElementById('auth-logout-item');
      if (existingEmailItem) existingEmailItem.remove();
      if (existingGuestItem) existingGuestItem.remove();
      if (existingSigninItem) existingSigninItem.remove();
      if (existingLogoutItem) existingLogoutItem.remove();

      if (user) {
        // Authenticated Supabase User
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

        const logoutLi = document.createElement('li');
        logoutLi.id = 'auth-logout-item';
        const logoutA = document.createElement('a');
        logoutA.href = '#';
        logoutA.textContent = 'Logout';
        logoutA.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await supabase.auth.signOut();
            localStorage.removeItem('snakeverse_guest_mode');
            window.location.href = 'login.html';
          } catch (err) {
            console.error('Error logging out:', err);
          }
        });
        logoutLi.appendChild(logoutA);

        navLinks.appendChild(emailLi);
        navLinks.appendChild(logoutLi);
      } else if (isGuestMode) {
        // Guest User
        const guestLi = document.createElement('li');
        guestLi.id = 'auth-guest-item';
        guestLi.style.display = 'inline-flex';
        guestLi.style.alignItems = 'center';
        guestLi.style.padding = '0 12px';

        const guestSpan = document.createElement('span');
        guestSpan.className = 'nav-guest-badge';
        guestSpan.textContent = 'Guest';

        guestLi.appendChild(guestSpan);

        const signinLi = document.createElement('li');
        signinLi.id = 'auth-signin-item';
        const signinA = document.createElement('a');
        signinA.href = 'login.html';
        signinA.textContent = 'Sign In';
        signinLi.appendChild(signinA);

        const logoutLi = document.createElement('li');
        logoutLi.id = 'auth-logout-item';
        const logoutA = document.createElement('a');
        logoutA.href = '#';
        logoutA.textContent = 'Exit Guest Mode';
        logoutA.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('snakeverse_guest_mode');
          window.location.href = 'login.html';
        });
        logoutLi.appendChild(logoutA);

        navLinks.appendChild(guestLi);
        navLinks.appendChild(signinLi);
        navLinks.appendChild(logoutLi);
      }
    }
  }
}

// Execute logic
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
