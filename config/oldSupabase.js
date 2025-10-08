const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Dedicated Supabase client for legacy/old database usage (e.g., FAQs)
// Reads OLD_* env variables first, falls back to NEW/current ones if missing
// Prefer OLD_* vars; fall back to provided legacy values; finally fall back to NEW/current
const LEGACY_FALLBACK_URL = 'https://vzyscxgvpzsqbkzpvttk.supabase.co';
const LEGACY_FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eXNjeGd2cHpzcWJrenB2dHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNjkzMjIsImV4cCI6MjA1NDg0NTMyMn0.-wZ1gvGILMPuBcN9IzC7jcCzggwtdtX-Hr7ZPoAWkms';

const oldSupabaseUrl = process.env.OLD_NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || LEGACY_FALLBACK_URL;
const oldSupabaseAnon = process.env.OLD_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || LEGACY_FALLBACK_ANON;

if (!oldSupabaseUrl || !oldSupabaseAnon) {
  console.warn('[oldSupabase] Missing OLD Supabase env and no fallbacks. Please set OLD_NEXT_PUBLIC_SUPABASE_URL and OLD_NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseOld = createClient(oldSupabaseUrl, oldSupabaseAnon, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabaseOld };


