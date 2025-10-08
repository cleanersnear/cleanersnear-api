const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ciiclyznupfdfwfqvrwo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.SUPABASE_ANON_KEY || 
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaWNseXpudXBmZGZ3ZnF2cndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjQwNjYsImV4cCI6MjA3NDY0MDA2Nn0.xnoUP_6hatwHt8HXl1ONOQHqSfsnnuP_i--1wFq2cZI';

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
