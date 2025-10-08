// ============================================================================
// NORMALIZED BOOKING DATABASE FUNCTIONS
// ============================================================================
// This module handles all database operations for the normalized booking structure

const { supabase } = require('../config/database');

// ============================================================================
// CREATE BOOKING (Normalized Structure)
// ============================================================================

/**
 * Creates a new booking in the normalized database structure
 * @param {Object} bookingData - The booking data from frontend
 * @returns {Promise<Object>} - Created booking with booking number
 */
async function createNormalizedBooking(bookingData) {
  try {
    console.log('💾 Creating normalized booking...');
    
    // Start a transaction-like process
    // Step 1: Generate sequential booking number
    const bookingNumber = await generateSequentialBookingNumber();
    console.log('📝 Generated booking number:', bookingNumber);
    
    // Step 2: Create customer record
    const customerId = await createCustomerRecord(bookingData.customerDetails);
    console.log('👤 Created customer record:', customerId);
    
    // Step 3: Create service-specific details record
    const serviceDetailsId = await createServiceDetailsRecord(
      bookingData.selectedService,
      bookingData.serviceDetails
    );
    console.log('🔧 Created service details record:', serviceDetailsId);
    
    // Step 4: Create customer sub-records if needed
    await createCustomerSubRecords(customerId, bookingData.customerDetails);
    console.log('📋 Created customer sub-records');
    
    // Step 5: Create main booking record
    const bookingId = await createMainBookingRecord({
      bookingNumber,
      customerId,
      serviceDetailsId,
      selectedService: bookingData.selectedService,
      pricing: bookingData.pricing,
      currentStep: bookingData.currentStep || 4
    });
    console.log('📦 Created main booking record:', bookingId);
    
    console.log('✅ Normalized booking created successfully:', bookingNumber);
    
    // Get the complete booking data to return to frontend
    const completeBooking = await getNormalizedBookingByNumber(bookingNumber);
    
    return {
      success: true,
      bookingNumber,
      status: 'pending',
      message: 'Booking submitted successfully! You will receive a confirmation email shortly.',
      data: completeBooking
    };
    
  } catch (error) {
    console.error('❌ Create normalized booking error:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR CREATING RECORDS
// ============================================================================

/**
 * Generates a sequential booking number (CH_0001, CH_0002, etc.)
 */
async function generateSequentialBookingNumber() {
  try {
    const { data, error } = await supabase.rpc('generate_sequential_booking_number');
    
    if (error) {
      console.error('❌ Generate booking number error:', error);
      throw new Error(`Failed to generate booking number: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Generate booking number error:', error);
    throw error;
  }
}

/**
 * Creates a customer record in the customers table
 */
async function createCustomerRecord(customerDetails) {
  try {
    const customerRecord = {
      first_name: customerDetails.firstName,
      last_name: customerDetails.lastName,
      email: customerDetails.email,
      phone: customerDetails.phone,
      address: customerDetails.address,
      postcode: customerDetails.postcode || null,
      suburb: customerDetails.suburb || null,
      schedule_date: customerDetails.scheduleDate,
      notes: customerDetails.notes || null
    };
    
    const { data, error } = await supabase
      .from('customers')
      .insert([customerRecord])
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Create customer error:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
    
    return data.id;
  } catch (error) {
    console.error('❌ Create customer record error:', error);
    throw error;
  }
}

/**
 * Creates service-specific details record based on service type
 */
async function createServiceDetailsRecord(selectedService, serviceDetails) {
  try {
    let tableName;
    let recordData;
    
    // Map service type to table and prepare data
    switch (selectedService) {
      case 'Regular Cleaning':
        tableName = 'regular_cleaning_details';
        recordData = {
          frequency: serviceDetails.frequency,
          duration: serviceDetails.duration,
          special_requests: serviceDetails.specialRequests || null
        };
        break;
        
      case 'Once-Off Cleaning':
        tableName = 'once_off_cleaning_details';
        recordData = {
          duration: serviceDetails.duration,
          two_cleaners: serviceDetails.twoCleaners || false,
          special_requests: serviceDetails.specialRequests || null
        };
        break;
        
      case 'NDIS Cleaning':
        tableName = 'ndis_cleaning_details';
        recordData = {
          frequency: serviceDetails.frequency,
          duration: serviceDetails.duration,
          special_requests: serviceDetails.specialRequests || null
        };
        break;
        
      case 'End of Lease Cleaning':
        tableName = 'end_of_lease_cleaning_details';
        recordData = {
          home_size: serviceDetails.homeSize,
          base_bathrooms: serviceDetails.baseBathrooms || 0,
          base_toilets: serviceDetails.baseToilets || 0,
          extra_bathrooms: serviceDetails.extraBathrooms || 0,
          extra_toilets: serviceDetails.extraToilets || 0,
          furnished: serviceDetails.furnished || false,
          study_room: serviceDetails.studyRoom || false,
          pets: serviceDetails.pets || false,
          steam_carpet: serviceDetails.steamCarpet || false,
          steam_bedrooms: serviceDetails.steamCounts?.bedrooms || 0,
          steam_living_rooms: serviceDetails.steamCounts?.livingRooms || 0,
          steam_hallway: serviceDetails.steamCounts?.hallway || false,
          steam_stairs: serviceDetails.steamCounts?.stairs || false,
          balcony: serviceDetails.extras?.balcony || false,
          garage: serviceDetails.extras?.garage || false,
          special_requests: serviceDetails.specialRequests || null
        };
        break;
        
      case 'Airbnb Cleaning':
        tableName = 'airbnb_cleaning_details';
        recordData = {
          service_type: serviceDetails.serviceType,
          frequency: serviceDetails.frequency || null,
          duration: serviceDetails.duration || null,
          linen_change: serviceDetails.extras?.linenChange || false,
          restock_amenities: serviceDetails.extras?.restockAmenities || false,
          special_requests: serviceDetails.specialRequests || null
        };
        break;
        
      case 'Commercial Cleaning':
        tableName = 'commercial_cleaning_details';
        recordData = {
          service_type: serviceDetails.serviceType,
          frequency: serviceDetails.frequency || null,
          hours_per_visit: serviceDetails.hoursPerVisit || null,
          staff_count: serviceDetails.staffCount || null,
          preferred_time: serviceDetails.preferredTime || null,
          special_requests: serviceDetails.specialRequests || null
        };
        break;
        
      default:
        throw new Error(`Unknown service type: ${selectedService}`);
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .insert([recordData])
      .select('id')
      .single();
    
    if (error) {
      console.error(`❌ Create ${tableName} error:`, error);
      throw new Error(`Failed to create service details: ${error.message}`);
    }
    
    return data.id;
  } catch (error) {
    console.error('❌ Create service details record error:', error);
    throw error;
  }
}

/**
 * Creates customer sub-records based on service type
 */
async function createCustomerSubRecords(customerId, customerDetails) {
  try {
    // Create NDIS details if present
    if (customerDetails.ndisDetails) {
      const ndisRecord = {
        customer_id: customerId,
        ndis_number: customerDetails.ndisDetails.ndisNumber || null,
        plan_manager: customerDetails.ndisDetails.planManager || null
      };
      
      const { error: ndisError } = await supabase
        .from('customer_ndis_details')
        .insert([ndisRecord]);
      
      if (ndisError) {
        console.error('❌ Create NDIS details error:', ndisError);
        throw new Error(`Failed to create NDIS details: ${ndisError.message}`);
      }
    }
    
    // Create Commercial details if present
    if (customerDetails.commercialDetails) {
      const commercialRecord = {
        customer_id: customerId,
        business_name: customerDetails.commercialDetails.businessName || null,
        business_type: customerDetails.commercialDetails.businessType || null,
        abn: customerDetails.commercialDetails.abn || null,
        contact_person: customerDetails.commercialDetails.contactPerson || null
      };
      
      const { error: commercialError } = await supabase
        .from('customer_commercial_details')
        .insert([commercialRecord]);
      
      if (commercialError) {
        console.error('❌ Create Commercial details error:', commercialError);
        throw new Error(`Failed to create Commercial details: ${commercialError.message}`);
      }
    }
    
    // Create End of Lease details if present
    if (customerDetails.endOfLeaseDetails) {
      const endOfLeaseRecord = {
        customer_id: customerId,
        role: customerDetails.endOfLeaseDetails.role || null
      };
      
      const { error: eolError } = await supabase
        .from('customer_end_of_lease_details')
        .insert([endOfLeaseRecord]);
      
      if (eolError) {
        console.error('❌ Create End of Lease details error:', eolError);
        throw new Error(`Failed to create End of Lease details: ${eolError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Create customer sub-records error:', error);
    throw error;
  }
}

/**
 * Creates the main booking record
 */
async function createMainBookingRecord({ bookingNumber, customerId, serviceDetailsId, selectedService, pricing, currentStep }) {
  try {
    const bookingRecord = {
      booking_number: bookingNumber,
      status: 'pending',
      current_step: currentStep,
      selected_service: selectedService,
      pricing: pricing,
      customer_id: customerId,
      service_details_id: serviceDetailsId
    };
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingRecord])
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Create main booking error:', error);
      throw new Error(`Failed to create main booking: ${error.message}`);
    }
    
    return data.id;
  } catch (error) {
    console.error('❌ Create main booking record error:', error);
    throw error;
  }
}

// ============================================================================
// GET BOOKING BY NUMBER (Normalized Structure)
// ============================================================================

/**
 * Retrieves a complete booking by its booking number
 * @param {string} bookingNumber - The booking number to search for
 * @returns {Promise<Object>} - Complete booking data
 */
async function getNormalizedBookingByNumber(bookingNumber) {
  try {
    console.log('🔍 Retrieving normalized booking:', bookingNumber);
    
    // Get the main booking with customer info
    const { data, error } = await supabase
      .from('complete_bookings')
      .select('*')
      .eq('booking_number', bookingNumber)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('❌ Database select error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Get service-specific details
    const serviceDetails = await getServiceSpecificDetails(
      data.selected_service,
      data.service_details_id
    );
    
    // Combine all data
    const completeBooking = {
      ...data,
      serviceDetails
    };
    
    console.log('✅ Normalized booking retrieved successfully');
    return completeBooking;
    
  } catch (error) {
    console.error('❌ Get normalized booking error:', error);
    throw error;
  }
}

/**
 * Gets service-specific details based on service type and ID
 */
async function getServiceSpecificDetails(selectedService, serviceDetailsId) {
  try {
    let tableName;
    
    switch (selectedService) {
      case 'Regular Cleaning':
        tableName = 'regular_cleaning_details';
        break;
      case 'Once-Off Cleaning':
        tableName = 'once_off_cleaning_details';
        break;
      case 'NDIS Cleaning':
        tableName = 'ndis_cleaning_details';
        break;
      case 'End of Lease Cleaning':
        tableName = 'end_of_lease_cleaning_details';
        break;
      case 'Airbnb Cleaning':
        tableName = 'airbnb_cleaning_details';
        break;
      case 'Commercial Cleaning':
        tableName = 'commercial_cleaning_details';
        break;
      default:
        throw new Error(`Unknown service type: ${selectedService}`);
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', serviceDetailsId)
      .single();
    
    if (error) {
      console.error(`❌ Get ${tableName} error:`, error);
      throw new Error(`Failed to get service details: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Get service specific details error:', error);
    throw error;
  }
}

// ============================================================================
// ADMIN PORTAL FUNCTIONS
// ============================================================================

/**
 * Gets all bookings for admin portal
 */
async function getAllBookingsForAdmin(limit = 50, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('complete_bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ Get all bookings error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Get all bookings for admin error:', error);
    throw error;
  }
}

/**
 * Gets today's bookings
 */
async function getTodaysBookingsNormalized() {
  try {
    const { data, error } = await supabase
      .from('todays_bookings')
      .select('*');
    
    if (error) {
      console.error('❌ Get today\'s bookings error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Get today\'s bookings normalized error:', error);
    throw error;
  }
}

/**
 * Gets pending bookings
 */
async function getPendingBookingsNormalized() {
  try {
    const { data, error } = await supabase
      .from('pending_bookings')
      .select('*');
    
    if (error) {
      console.error('❌ Get pending bookings error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Get pending bookings normalized error:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createNormalizedBooking,
  getNormalizedBookingByNumber,
  getAllBookingsForAdmin,
  getTodaysBookingsNormalized,
  getPendingBookingsNormalized,
  generateSequentialBookingNumber
};
