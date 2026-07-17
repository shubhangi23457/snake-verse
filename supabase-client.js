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

// Create and export the singleton client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
