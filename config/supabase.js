import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Export as a named export to maintain compatibility with existing routes
export const supabase = createClient(supabaseUrl, supabaseKey); 