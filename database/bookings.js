const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration - NO HARDCODED FALLBACKS
// Supports both NEXT_PUBLIC_ prefixed (frontend style) and regular backend env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.SUPABASE_ANON_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  console.error('❌ CRITICAL: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable is required!');
  console.error('💡 Please set SUPABASE_URL in your .env file or deployment environment');
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required!');
  console.error('💡 Please set SUPABASE_SERVICE_ROLE_KEY in your .env file or deployment environment');
  throw new Error('Missing Supabase key environment variable');
}

console.log('✅ Using Supabase URL:', supabaseUrl);
console.log('🔑 Using Supabase key:', supabaseServiceKey.substring(0, 20) + '...' + supabaseServiceKey.substring(supabaseServiceKey.length - 10));

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test database connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('test_records')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
}

module.exports = {
  supabase,
  testConnection
};
