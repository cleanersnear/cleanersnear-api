// ============================================================================
// BOOKING DATABASE FUNCTIONS
// ============================================================================
// This module handles all database operations for bookings

const { supabase } = require('../config/database');
const { generate_booking_number } = require('./helpers');

// ============================================================================
// CREATE BOOKING
// ============================================================================

/**
 * Creates a new booking in the database
 * @param {Object} bookingData - The booking data from frontend
 * @returns {Promise<Object>} - Created booking with booking number
 */
async function createBooking(bookingData) {
  try {
    
    // Generate unique booking number
    const bookingNumber = await generateBookingNumber();
    
    // Prepare database record
    const dbRecord = {
      booking_number: bookingNumber,
      status: 'pending',
      current_step: bookingData.currentStep || 4, // Usually created at step 4
      selected_service: bookingData.selectedService,
      service_details: bookingData.serviceDetails || {},
      
      // Customer information
      customer_first_name: bookingData.customerDetails.firstName,
      customer_last_name: bookingData.customerDetails.lastName,
      customer_email: bookingData.customerDetails.email,
      customer_phone: bookingData.customerDetails.phone,
      
      // Service address
      service_address: bookingData.customerDetails.address,
      service_postcode: bookingData.customerDetails.postcode || null,
      service_suburb: bookingData.customerDetails.suburb || null,
      
      // Schedule
      schedule_date: bookingData.customerDetails.scheduleDate,
      
      // Additional information
      notes: bookingData.customerDetails.notes || null,
      
      // Service-specific details
      ndis_details: bookingData.customerDetails.ndisDetails || null,
      commercial_details: bookingData.customerDetails.commercialDetails || null,
      end_of_lease_details: bookingData.customerDetails.endOfLeaseDetails || null,
      
      // Pricing
      pricing: bookingData.pricing || {}
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('bookings')
      .insert([dbRecord])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return {
      success: true,
      bookingNumber,
      status: 'pending',
      message: 'Booking submitted successfully! You will receive a confirmation email shortly.',
      data: data
    };
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// GET BOOKING BY NUMBER
// ============================================================================

/**
 * Retrieves a booking by its booking number
 * @param {string} bookingNumber - The booking number to search for
 * @returns {Promise<Object>} - Booking data
 */
async function getBookingByNumber(bookingNumber) {
  try {
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_number', bookingNumber)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// UPDATE BOOKING STATUS
// ============================================================================

/**
 * Updates the status of a booking
 * @param {string} bookingNumber - The booking number
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated booking
 */
async function updateBookingStatus(bookingNumber, status) {
  try {
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('booking_number', bookingNumber)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// GET BOOKINGS BY DATE RANGE
// ============================================================================

/**
 * Retrieves bookings within a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of bookings
 */
async function getBookingsByDateRange(startDate, endDate) {
  try {
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date', { ascending: true });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// GET TODAY'S BOOKINGS
// ============================================================================

/**
 * Retrieves all bookings scheduled for today
 * @returns {Promise<Array>} - Array of today's bookings
 */
async function getTodaysBookings() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('schedule_date', today)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// GET PENDING BOOKINGS
// ============================================================================

/**
 * Retrieves all pending bookings
 * @returns {Promise<Array>} - Array of pending bookings
 */
async function getPendingBookings() {
  try {
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// SEARCH BOOKINGS
// ============================================================================

/**
 * Searches bookings by customer email or booking number
 * @param {string} searchTerm - Email or booking number to search for
 * @returns {Promise<Array>} - Array of matching bookings
 */
async function searchBookings(searchTerm) {
  try {
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`customer_email.ilike.%${searchTerm}%,booking_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// BOOKING STATISTICS
// ============================================================================

/**
 * Gets booking statistics for dashboard
 * @param {string} startDate - Start date for stats (optional)
 * @param {string} endDate - End date for stats (optional)
 * @returns {Promise<Object>} - Statistics object
 */
async function getBookingStatistics(startDate, endDate) {
  try {
    
    let query = supabase.from('bookings').select('status, schedule_date, pricing');
    
    if (startDate && endDate) {
      query = query.gte('schedule_date', startDate).lte('schedule_date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Calculate statistics
    const stats = {
      total: data.length,
      pending: data.filter(b => b.status === 'pending').length,
      confirmed: data.filter(b => b.status === 'confirmed').length,
      completed: data.filter(b => b.status === 'completed').length,
      cancelled: data.filter(b => b.status === 'cancelled').length,
      totalRevenue: data.reduce((sum, b) => {
        const price = parseFloat(b.pricing?.totalPrice) || 0;
        return sum + price;
      }, 0)
    };
    
    return stats;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates a unique booking number
 * @returns {Promise<string>} - Unique booking number
 */
async function generateBookingNumber() {
  try {
    // Try to use the database function first
    const { data, error } = await supabase.rpc('generate_booking_number');
    
    if (!error && data) {
      return data;
    }
    
    // Fallback to JavaScript generation
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CH-${timestamp}-${random}`;
    
  } catch (error) {
    // Final fallback
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CH-${timestamp}-${random}`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createBooking,
  getBookingByNumber,
  updateBookingStatus,
  getBookingsByDateRange,
  getTodaysBookings,
  getPendingBookings,
  searchBookings,
  getBookingStatistics,
  generateBookingNumber
};
