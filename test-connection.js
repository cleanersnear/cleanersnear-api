import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://mxnzjvvbdmujzvhprclj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bnpqdnZiZG11anp2aHByY2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMDQwMTYsImV4cCI6MjA1MjY4MDAxNn0.v7Vqj3NyB0zmoWOWmtL9If2Mu53oyepKsxJcaSR8ejc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Insert sample data
        const { data, error } = await supabase
            .from('cleaners')  // Make sure this table exists in your Supabase dashboard
            .insert([
                {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '123-456-7890'
                }
            ])
            .select();

        if (error) throw error;

        console.log('Connection successful!');
        console.log('Inserted data:', data);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the test
testConnection(); 