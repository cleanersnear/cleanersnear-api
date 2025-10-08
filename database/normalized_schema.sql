-- ============================================================================
-- CLEAN HOME PROJECT - NORMALIZED BOOKING DATABASE SCHEMA
-- ============================================================================
-- This schema creates a normalized structure for better admin portal management
-- Run this in your Supabase SQL editor

-- ============================================================================
-- 1. MAIN BOOKINGS TABLE (Primary booking information)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
    -- Primary Key with sequential ID pattern CH_0001, CH_0002, etc.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(10) UNIQUE NOT NULL, -- CH_0001, CH_0002, etc.
    
    -- Booking Status & Progress
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'error', 'completed', 'cancelled')),
    current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 4),
    
    -- Service Information
    selected_service VARCHAR(50) NOT NULL CHECK (selected_service IN (
        'Regular Cleaning', 
        'Once-Off Cleaning', 
        'NDIS Cleaning', 
        'End of Lease Cleaning', 
        'Airbnb Cleaning', 
        'Commercial Cleaning'
    )),
    
    -- Pricing Information (stored as JSONB for flexibility)
    pricing JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign Keys (will be set after other tables are created)
    customer_id UUID,
    service_details_id UUID
);

-- ============================================================================
-- 2. CUSTOMERS TABLE (Customer details from Step 3 - yourdetails)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Contact Information
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Service Address
    address TEXT NOT NULL,
    postcode VARCHAR(10),
    suburb VARCHAR(100),
    
    -- Schedule
    schedule_date DATE NOT NULL,
    
    -- Additional Information
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CUSTOMER SUB-TABLES (Service-specific customer details)
-- ============================================================================

-- NDIS Customer Details
CREATE TABLE IF NOT EXISTS customer_ndis_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    ndis_number VARCHAR(50),
    plan_manager VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commercial Customer Details
CREATE TABLE IF NOT EXISTS customer_commercial_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_type VARCHAR(50) CHECK (business_type IN (
        'office', 'retail', 'agedCare', 'educationChildCare', 'government', 
        'medical', 'gymFitness', 'restaurantHospitality', 'warehouseIndustrial', 'other'
    )),
    abn VARCHAR(20),
    contact_person VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- End of Lease Customer Details
CREATE TABLE IF NOT EXISTS customer_end_of_lease_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    role VARCHAR(30) CHECK (role IN ('Tenant', 'Property Owner', 'Real Estate Agent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. SERVICE-SPECIFIC TABLES (Service details from Step 2)
-- ============================================================================

-- Regular Cleaning Service Details
CREATE TABLE IF NOT EXISTS regular_cleaning_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('Weekly', 'Fortnightly')),
    duration VARCHAR(10) NOT NULL CHECK (duration IN ('2 hours', '3 hours', '4 hours', '5 hours', '6 hours', '7 hours', '8 hours')),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Once-Off Cleaning Service Details
CREATE TABLE IF NOT EXISTS once_off_cleaning_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duration VARCHAR(10) NOT NULL CHECK (duration IN ('3 hours', '4 hours', '5 hours', '6 hours', '7 hours', '8 hours')),
    two_cleaners BOOLEAN DEFAULT FALSE,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NDIS Cleaning Service Details
CREATE TABLE IF NOT EXISTS ndis_cleaning_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('Weekly', 'Fortnightly', 'Once-off')),
    duration VARCHAR(10) NOT NULL CHECK (duration IN ('2 hours', '3 hours', '4 hours', '5 hours', '6 hours', '7 hours', '8 hours')),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- End of Lease Cleaning Service Details
CREATE TABLE IF NOT EXISTS end_of_lease_cleaning_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_size VARCHAR(10) NOT NULL CHECK (home_size IN ('Studio', '1 Bed', '2 Bed', '3 Bed', '4 Bed', '5+ Bed')),
    
    -- Base amenities
    base_bathrooms INTEGER DEFAULT 0,
    base_toilets INTEGER DEFAULT 0,
    
    -- Extra amenities
    extra_bathrooms INTEGER DEFAULT 0,
    extra_toilets INTEGER DEFAULT 0,
    
    -- Additional features
    furnished BOOLEAN DEFAULT FALSE,
    study_room BOOLEAN DEFAULT FALSE,
    pets BOOLEAN DEFAULT FALSE,
    
    -- Steam cleaning
    steam_carpet BOOLEAN DEFAULT FALSE,
    steam_bedrooms INTEGER DEFAULT 0,
    steam_living_rooms INTEGER DEFAULT 0,
    steam_hallway BOOLEAN DEFAULT FALSE,
    steam_stairs BOOLEAN DEFAULT FALSE,
    
    -- Extras
    balcony BOOLEAN DEFAULT FALSE,
    garage BOOLEAN DEFAULT FALSE,
    
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airbnb Cleaning Service Details
CREATE TABLE IF NOT EXISTS airbnb_cleaning_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('Regular', 'Once-off')),
    frequency VARCHAR(20) CHECK (frequency IN ('Daily', 'Weekly', 'Fortnightly')),
    duration VARCHAR(10) CHECK (duration IN ('2 hours', '3 hours', '4 hours', '5 hours', '6 hours', '7 hours', '8 hours')),
    linen_change BOOLEAN DEFAULT FALSE,
    restock_amenities BOOLEAN DEFAULT FALSE,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commercial Cleaning Service Details
CREATE TABLE IF NOT EXISTS commercial_cleaning_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('Once-off', 'Regular')),
    frequency VARCHAR(20) CHECK (frequency IN ('Daily', 'Weekly', 'Fortnightly', 'Monthly')),
    hours_per_visit INTEGER,
    staff_count INTEGER,
    preferred_time VARCHAR(20) CHECK (preferred_time IN ('During Hours', 'After Hours', 'Before Hours')),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. ADD FOREIGN KEY CONSTRAINTS TO BOOKINGS TABLE
-- ============================================================================

-- Add foreign key constraints after all tables are created
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_customer_id 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Note: service_details_id will be set dynamically based on service type
-- We'll handle this in the application logic

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Main bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_selected_service ON bookings(selected_service);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_schedule_date ON customers(schedule_date);

-- Customer sub-table indexes
CREATE INDEX IF NOT EXISTS idx_customer_ndis_customer_id ON customer_ndis_details(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_commercial_customer_id ON customer_commercial_details(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_end_of_lease_customer_id ON customer_end_of_lease_details(customer_id);

-- Service details table indexes
CREATE INDEX IF NOT EXISTS idx_regular_cleaning_id ON regular_cleaning_details(id);
CREATE INDEX IF NOT EXISTS idx_once_off_cleaning_id ON once_off_cleaning_details(id);
CREATE INDEX IF NOT EXISTS idx_ndis_cleaning_id ON ndis_cleaning_details(id);
CREATE INDEX IF NOT EXISTS idx_end_of_lease_cleaning_id ON end_of_lease_cleaning_details(id);
CREATE INDEX IF NOT EXISTS idx_airbnb_cleaning_id ON airbnb_cleaning_details(id);
CREATE INDEX IF NOT EXISTS idx_commercial_cleaning_id ON commercial_cleaning_details(id);

-- ============================================================================
-- 7. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for all tables with updated_at columns
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_ndis_updated_at BEFORE UPDATE ON customer_ndis_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_commercial_updated_at BEFORE UPDATE ON customer_commercial_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_end_of_lease_updated_at BEFORE UPDATE ON customer_end_of_lease_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regular_cleaning_updated_at BEFORE UPDATE ON regular_cleaning_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_once_off_cleaning_updated_at BEFORE UPDATE ON once_off_cleaning_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ndis_cleaning_updated_at BEFORE UPDATE ON ndis_cleaning_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_end_of_lease_cleaning_updated_at BEFORE UPDATE ON end_of_lease_cleaning_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_airbnb_cleaning_updated_at BEFORE UPDATE ON airbnb_cleaning_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_cleaning_updated_at BEFORE UPDATE ON commercial_cleaning_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. SEQUENTIAL BOOKING NUMBER GENERATION
-- ============================================================================

-- Function to generate sequential booking numbers CH_0001, CH_0002, etc.
CREATE OR REPLACE FUNCTION generate_sequential_booking_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    booking_num TEXT;
BEGIN
    -- Get the next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(booking_number FROM 4) AS INTEGER)), 0) + 1 
    INTO next_number 
    FROM bookings 
    WHERE booking_number ~ '^CH_[0-9]+$';
    
    -- Format as CH_XXXX (4 digits with leading zeros)
    booking_num := 'CH_' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN booking_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. VIEWS FOR ADMIN PORTAL
-- ============================================================================

-- Complete booking view with all related data
CREATE OR REPLACE VIEW complete_bookings AS
SELECT 
    b.id,
    b.booking_number,
    b.status,
    b.selected_service,
    b.pricing,
    b.created_at,
    b.updated_at,
    
    -- Customer information
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.address,
    c.postcode,
    c.suburb,
    c.schedule_date,
    c.notes,
    
    -- NDIS details (if applicable)
    nd.ndis_number,
    nd.plan_manager,
    
    -- Commercial details (if applicable)
    cd.business_name,
    cd.business_type,
    cd.abn,
    cd.contact_person,
    
    -- End of lease details (if applicable)
    eol.role as end_of_lease_role,
    
    -- Service details (will be populated based on service type)
    b.service_details_id
    
FROM bookings b
JOIN customers c ON b.customer_id = c.id
LEFT JOIN customer_ndis_details nd ON c.id = nd.customer_id
LEFT JOIN customer_commercial_details cd ON c.id = cd.customer_id
LEFT JOIN customer_end_of_lease_details eol ON c.id = eol.customer_id;

-- Today's bookings view
CREATE OR REPLACE VIEW todays_bookings AS
SELECT 
    booking_number,
    selected_service,
    first_name || ' ' || last_name AS customer_name,
    phone,
    address,
    schedule_date,
    pricing->>'totalPrice' AS total_price,
    status
FROM complete_bookings
WHERE schedule_date = CURRENT_DATE
ORDER BY schedule_date, created_at;

-- Pending bookings view
CREATE OR REPLACE VIEW pending_bookings AS
SELECT 
    booking_number,
    selected_service,
    first_name || ' ' || last_name AS customer_name,
    email,
    address,
    schedule_date,
    pricing->>'totalPrice' AS total_price,
    created_at
FROM complete_bookings
WHERE status = 'pending'
ORDER BY created_at DESC;

-- ============================================================================
-- 10. VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate booking data before insertion
CREATE OR REPLACE FUNCTION validate_booking_data(
    p_selected_service VARCHAR(50),
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_email VARCHAR(255),
    p_phone VARCHAR(20),
    p_address TEXT,
    p_schedule_date DATE,
    p_pricing JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields
    IF p_selected_service IS NULL OR p_selected_service = '' THEN
        RAISE EXCEPTION 'Selected service is required';
    END IF;
    
    IF p_first_name IS NULL OR p_first_name = '' THEN
        RAISE EXCEPTION 'Customer first name is required';
    END IF;
    
    IF p_last_name IS NULL OR p_last_name = '' THEN
        RAISE EXCEPTION 'Customer last name is required';
    END IF;
    
    IF p_email IS NULL OR p_email = '' THEN
        RAISE EXCEPTION 'Customer email is required';
    END IF;
    
    IF p_phone IS NULL OR p_phone = '' THEN
        RAISE EXCEPTION 'Customer phone is required';
    END IF;
    
    IF p_address IS NULL OR p_address = '' THEN
        RAISE EXCEPTION 'Service address is required';
    END IF;
    
    IF p_schedule_date IS NULL THEN
        RAISE EXCEPTION 'Schedule date is required';
    END IF;
    
    IF p_pricing IS NULL OR p_pricing->>'totalPrice' IS NULL THEN
        RAISE EXCEPTION 'Pricing information is required';
    END IF;
    
    -- Check email format
    IF NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Check schedule date is not in the past
    IF p_schedule_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Schedule date cannot be in the past';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users (adjust based on your auth setup)
-- GRANT SELECT, INSERT, UPDATE ON bookings TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON customer_ndis_details TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON customer_commercial_details TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON customer_end_of_lease_details TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON regular_cleaning_details TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON once_off_cleaning_details TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON ndis_cleaning_details TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON end_of_lease_cleaning_details TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON airbnb_cleaning_details TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON commercial_cleaning_details TO authenticated;

-- ============================================================================
-- 12. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE bookings IS 'Main booking table with primary booking information and sequential booking numbers';
COMMENT ON TABLE customers IS 'Customer information from Step 3 (yourdetails) of booking process';
COMMENT ON TABLE customer_ndis_details IS 'NDIS-specific customer information';
COMMENT ON TABLE customer_commercial_details IS 'Commercial cleaning specific customer information';
COMMENT ON TABLE customer_end_of_lease_details IS 'End of lease cleaning specific customer information';
COMMENT ON TABLE regular_cleaning_details IS 'Regular cleaning service specific details';
COMMENT ON TABLE once_off_cleaning_details IS 'Once-off cleaning service specific details';
COMMENT ON TABLE ndis_cleaning_details IS 'NDIS cleaning service specific details';
COMMENT ON TABLE end_of_lease_cleaning_details IS 'End of lease cleaning service specific details';
COMMENT ON TABLE airbnb_cleaning_details IS 'Airbnb cleaning service specific details';
COMMENT ON TABLE commercial_cleaning_details IS 'Commercial cleaning service specific details';

COMMENT ON VIEW complete_bookings IS 'Complete booking view with all related customer and service data';
COMMENT ON VIEW todays_bookings IS 'Bookings scheduled for today';
COMMENT ON VIEW pending_bookings IS 'Bookings awaiting confirmation';
