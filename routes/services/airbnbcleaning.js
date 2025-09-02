import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Generate unique booking number in AIR_001 format
async function generateBookingNumber() {
  try {
    // Get the latest booking number from the database
    const { data: latestBooking, error } = await supabase
      .from('AirbnbCleaningBooking')
      .select('bookingNumber')
      .order('id', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (latestBooking && latestBooking.length > 0) {
      // Extract the number from the latest booking (e.g., "AIR_001" -> 1)
      const lastNumberMatch = latestBooking[0].bookingNumber.match(/AIR_(\d+)/);
      if (lastNumberMatch) {
        nextNumber = parseInt(lastNumberMatch[1]) + 1;
      }
    }

    // Format as AIR_001, AIR_002, etc.
    return `AIR_${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating booking number:', error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `AIR_${timestamp}${random}`;
  }
}

// Stage 1: Submit basic booking details (Step 4)
router.post('/submit-basic', async (req, res) => {
  try {
    console.log('Received submit-basic request with body:', req.body);
    
    const {
      propertyAddress,
      serviceType,
      hours,
      customHours,
      name,
      email,
      phone,
      bedrooms,
      bathrooms,
      toilets,
      date,
      time
    } = req.body;

    // Validate required fields
    if (!propertyAddress || !serviceType || !hours || !name || !email || !phone) {
      console.log('Missing required fields:', { propertyAddress, serviceType, hours, name, email, phone });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing: {
          propertyAddress: !propertyAddress,
          serviceType: !serviceType,
          hours: !hours,
          name: !name,
          email: !email,
          phone: !phone
        }
      });
    }

    // For step 4 submission, date and time are not required yet (they come in step 6)
    // Only validate the essential fields for basic booking submission

    // Generate unique booking number
    const bookingNumber = await generateBookingNumber();

    // Calculate final hours
    const finalHours = hours === 'custom' ? parseInt(customHours) : parseInt(hours);

    // Calculate pricing
    const hourlyRate = 49.89;
    let discount = 0;
    if (serviceType === 'weekly') discount = 15;
    if (serviceType === 'fortnightly') discount = 5;
    
    const basePrice = finalHours * hourlyRate;
    const finalPrice = basePrice * (1 - discount / 100);

    // Create booking record in Supabase
    // createdAt: Actual booking creation timestamp (when user submits step 4)
    // date: Will be null initially, updated in step 7 with user's selected date
    const insertData = {
      bookingNumber,
      propertyAddress,
      serviceType,
      hours: finalHours,
      name,
      email,
      phone,
      bedrooms: bedrooms && bedrooms.trim() !== '' ? bedrooms : null,
      bathrooms: bathrooms && bathrooms.trim() !== '' ? bathrooms : null,
      toilets: toilets && toilets.trim() !== '' ? toilets : null,
      date: date && date.trim() !== '' ? new Date(date).toISOString() : null, // Will be null in step 4
      time: time && time.trim() !== '' ? time : null, // Will be null in step 4
      basePrice,
      discount,
      finalPrice,
      status: 'PENDING_EXTRAS',
      createdAt: new Date().toISOString() // Actual booking creation time
    };

    console.log('Property details being inserted:', {
      bedrooms: insertData.bedrooms,
      bathrooms: insertData.bathrooms,
      toilets: insertData.toilets
    });

    console.log('Inserting data into Supabase:', insertData);

    const { data: booking, error } = await supabase
      .from('AirbnbCleaningBooking')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        schema: error.schema,
        table: error.table,
        column: error.column,
        dataType: error.dataType,
        constraint: error.constraint
      });
      
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + error.message,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          schema: error.schema,
          table: error.table,
          column: error.column,
          dataType: error.dataType,
          constraint: error.constraint
        },
        insertData: insertData // Include the data that was being inserted
      });
    }

    console.log('Successfully created booking:', booking);

    res.json({
      success: true,
      bookingNumber,
      message: 'Basic booking details submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting basic booking:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      }
    });
  }
});

// Update property details (Step 5)
router.post('/update-property-details', async (req, res) => {
  try {
    console.log('Received update-property-details request with body:', req.body);
    
    const { bookingNumber, bedrooms, bathrooms, toilets } = req.body;

    if (!bookingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Booking number is required'
      });
    }

    // Validate property details
    if (!bedrooms || !bathrooms || !toilets) {
      console.log('Missing property details:', { bedrooms, bathrooms, toilets });
      return res.status(400).json({
        success: false,
        message: 'All property details are required',
        missing: {
          bedrooms: !bedrooms,
          bathrooms: !bathrooms,
          toilets: !toilets
        }
      });
    }

    // Find existing booking
    const { data: existingBooking, error: findError } = await supabase
      .from('AirbnbCleaningBooking')
      .select('*')
      .eq('bookingNumber', bookingNumber)
      .single();

    if (findError || !existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking with property details
    const updateData = {
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      toilets: toilets
    };

    console.log('Updating booking with property details:', updateData);

    const { data: updatedBooking, error: updateError } = await supabase
      .from('AirbnbCleaningBooking')
      .update(updateData)
      .eq('bookingNumber', bookingNumber)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + updateError.message,
        error: {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        }
      });
    }

    console.log('Successfully updated booking with property details:', updatedBooking);

    res.json({
      success: true,
      bookingNumber,
      message: 'Property details updated successfully'
    });

  } catch (error) {
    console.error('Error updating property details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      }
    });
  }
});

// Stage 2: Submit extras and complete booking (Step 7)
router.post('/submit-extras', async (req, res) => {
  try {
    const { bookingNumber, extras, date, time } = req.body;

    if (!bookingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Booking number is required'
      });
    }

    // Validate date and time for final submission
    if (!date || date.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Date is required for final submission'
      });
    }

    if (!time || time.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Time is required for final submission'
      });
    }

    // Find existing booking
    const { data: existingBooking, error: findError } = await supabase
      .from('AirbnbCleaningBooking')
      .select('*')
      .eq('bookingNumber', bookingNumber)
      .single();

    if (findError || !existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking with extras and date/time
    // date: User-selected cleaning date from step 6
    // createdAt: Actual booking creation timestamp (set in step 4)
    const updateData = {
      extras: extras || [],
      date: new Date(date).toISOString(), // User's selected cleaning date
      time: time, // User's selected cleaning time
      status: 'CONFIRMED',
      completedAt: new Date().toISOString() // When booking was completed
    };

    console.log('Updating booking with date/time:', {
      userSelectedDate: date,
      userSelectedTime: time,
      finalDate: updateData.date
    });

    console.log('Updating booking with data:', updateData);

    const { data: updatedBooking, error: updateError } = await supabase
      .from('AirbnbCleaningBooking')
      .update(updateData)
      .eq('bookingNumber', bookingNumber)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        schema: updateError.schema,
        table: updateError.table,
        column: updateError.column,
        dataType: updateError.dataType,
        constraint: updateError.constraint
      });
      
      return res.status(500).json({
        success: false,
        message: 'Database error: ' + updateError.message,
        error: {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          schema: updateError.schema,
          table: updateError.table,
          column: updateError.column,
          dataType: updateError.dataType,
          constraint: updateError.constraint
        },
        updateData: updateData,
        bookingNumber: bookingNumber
      });
    }

    res.json({
      success: true,
      bookingNumber,
      message: 'Booking completed successfully'
    });

  } catch (error) {
    console.error('Error submitting extras:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get booking details for confirmation page
router.get('/booking/:bookingNumber', async (req, res) => {
  try {
    const { bookingNumber } = req.params;

    const { data: booking, error } = await supabase
      .from('AirbnbCleaningBooking')
      .select('*')
      .eq('bookingNumber', bookingNumber)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test Supabase connection and table access
router.get('/test-supabase', async (req, res) => {
  try {
    console.log('Testing Supabase connection and table access...')
    
    // Test 1: Check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('AirbnbCleaningBooking')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Supabase connection test failed:', testError)
      return res.status(500).json({
        success: false,
        message: 'Supabase connection test failed',
        error: {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        }
      })
    }
    
    // Test 2: Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'AirbnbCleaningBooking' })
      .catch(() => ({ data: null, error: { message: 'RPC function not available' } }))
    
    console.log('Supabase connection test successful')
    
    res.json({
      success: true,
      message: 'Supabase connection and table access successful',
      tableAccess: true,
      tableInfo: tableInfo || 'RPC function not available'
    })
    
  } catch (error) {
    console.error('Supabase test error:', error)
    res.status(500).json({
      success: false,
      message: 'Supabase test error',
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      }
    })
  }
})

export default router;
