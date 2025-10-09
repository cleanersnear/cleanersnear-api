-- ============================================================================
-- HEALTH CHECK TABLE
-- ============================================================================
-- Simple table for testing database connectivity
-- Used by the testConnection() function in config/database.js

CREATE TABLE IF NOT EXISTS test_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    count INTEGER DEFAULT 0,
    message TEXT DEFAULT 'Database connection is healthy',
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a test record
INSERT INTO test_records (count, message) 
VALUES (1, 'Health check test record')
ON CONFLICT DO NOTHING;

-- Create an index for quick lookups
CREATE INDEX IF NOT EXISTS idx_test_records_created_at ON test_records(created_at);

-- Add a comment
COMMENT ON TABLE test_records IS 'Health check table for testing database connectivity';



