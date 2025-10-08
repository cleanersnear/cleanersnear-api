// ============================================================================
// BACKEND CONSTANTS
// ============================================================================
// Simple constants for backend logic - frontend types handle data structure

const BOOKING_STEPS = {
  SERVICE_SELECTION: 1,
  SERVICE_DETAILS: 2,
  CUSTOMER_DETAILS: 3,
  CONFIRMATION: 4
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ERROR: 'error',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const SERVICE_TYPES = {
  REGULAR_CLEANING: 'Regular Cleaning',
  ONCE_OFF_CLEANING: 'Once-Off Cleaning',
  NDIS_CLEANING: 'NDIS Cleaning',
  END_OF_LEASE_CLEANING: 'End of Lease Cleaning',
  AIRBNB_CLEANING: 'Airbnb Cleaning',
  COMMERCIAL_CLEANING: 'Commercial Cleaning'
};

// ============================================================================
// DATABASE SCHEMA CONSTANTS
// ============================================================================

// Main bookings table structure (simplified for reference)
const BOOKINGS_TABLE_SCHEMA = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid()',
  booking_number: 'varchar(10) UNIQUE NOT NULL', // CH_0001, CH_0002, etc.
  status: `varchar(20) DEFAULT '${BOOKING_STATUS.PENDING}'`,
  selected_service: 'varchar(50) NOT NULL',
  pricing: 'jsonb NOT NULL',
  customer_id: 'uuid',
  service_details_id: 'uuid',
  created_at: 'timestamp with time zone DEFAULT now()',
  updated_at: 'timestamp with time zone DEFAULT now()'
};

// ============================================================================
// API RESPONSE STRUCTURE
// ============================================================================

const BOOKING_API_RESPONSE = {
  success: 'boolean',
  bookingNumber: 'string',
  status: 'string',
  message: 'string',
  data: 'object (optional)' // Complete booking data for frontend
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Constants for backend logic
  BOOKING_STEPS,
  BOOKING_STATUS,
  SERVICE_TYPES,
  
  // Database schema reference
  BOOKINGS_TABLE_SCHEMA,
  
  // API response structure
  BOOKING_API_RESPONSE
};

