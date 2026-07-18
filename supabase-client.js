/**
 * supabase-client.js
 *
 * Creates a single shared Supabase client instance.
 * All pages import this to talk to the database and auth.
 *
 * Vite replaces import.meta.env.* at build time with
 * the values from the .env file.
 */

import { createClient } from '@supabase/supabase-js';

// Read credentials from environment variables
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    "Supabase configuration is missing. " +
    "Please check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables."
  );
}

// Robust fallback dummy client to prevent runtime initialization crashes
const dummyClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: new Error("Supabase is not configured.") }),
    signInWithPassword: async () => ({ data: {}, error: new Error("Supabase is not configured.") }),
    signUp: async () => ({ data: {}, error: new Error("Supabase is not configured.") }),
    signOut: async () => ({ error: new Error("Supabase is not configured.") }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({
      order: () => ({
        limit: () => Promise.resolve({ data: [], error: new Error("Supabase is not configured.") }),
      }),
      eq: () => Promise.resolve({ data: [], error: new Error("Supabase is not configured.") }),
    }),
    insert: () => Promise.resolve({ error: new Error("Supabase is not configured.") }),
    update: () => ({
      eq: () => Promise.resolve({ error: new Error("Supabase is not configured.") }),
    }),
  }),
};

// Create and export the singleton client
export const supabase = (SUPABASE_URL && SUPABASE_ANON)
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : dummyClient;
