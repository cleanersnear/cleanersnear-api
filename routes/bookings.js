const express = require('express');
const router = express.Router();
const { createNormalizedBooking, getNormalizedBookingByNumber } = require('../database/normalized_bookings');
const { sendAdminBookingNotification, sendBookingCustomerConfirmation } = require('../services/emailService');
const { saveMainBookingNotificationToDatabase } = require('./notification/notification');

// ============================================================================
// BOOKING ROUTES
// ============================================================================

// GET /api/bookings - Health/info for bookings route
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Bookings API is reachable',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Health check failed' });
  }
});

// POST /api/bookings - Create new booking
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    
    console.log('📝 Booking started');

    // Validate required fields
    if (!bookingData.selectedService) {
      return res.status(400).json({
        success: false,
        bookingNumber: '',
        status: 'error',
        message: 'Service selection is required'
      });
    }

    if (!bookingData.customerDetails?.firstName || !bookingData.customerDetails?.lastName) {
      return res.status(400).json({
        success: false,
        bookingNumber: '',
        status: 'error',
        message: 'Customer name is required'
      });
    }

    if (!bookingData.customerDetails?.email) {
      return res.status(400).json({
        success: false,
        bookingNumber: '',
        status: 'error',
        message: 'Customer email is required'
      });
    }

    if (!bookingData.customerDetails?.phone) {
      return res.status(400).json({
        success: false,
        bookingNumber: '',
        status: 'error',
        message: 'Customer phone number is required'
      });
    }

    if (!bookingData.customerDetails?.address) {
      return res.status(400).json({
        success: false,
        bookingNumber: '',
        status: 'error',
        message: 'Service address is required'
      });
    }

    if (!bookingData.customerDetails?.scheduleDate) {
      return res.status(400).json({
        success: false,
        bookingNumber: '',
        status: 'error',
        message: 'Schedule date is required'
      });
    }

    // Create booking in normalized database structure
    const result = await createNormalizedBooking(bookingData);
    
    console.log('💾 Booking saved');

    // Send response immediately
    res.status(200).json(result);

    // ============================================================================
    // PARALLEL POST-BOOKING TRIGGERS (All independent, failures don't affect others)
    // ============================================================================
    
    const bookingNumber = result?.bookingNumber;
    const savedBookingData = result?.data;

    if (!bookingNumber || !savedBookingData) {
      console.warn('⚠️ Missing booking data for post-booking triggers');
      return;
    }

    // Parse pricing if it's a JSON string
    let pricingData = savedBookingData.pricing;
    if (typeof pricingData === 'string') {
      try {
        pricingData = JSON.parse(pricingData);
      } catch {
        console.warn('⚠️ Could not parse pricing data');
      }
    }

    // TRIGGER 1: Send Emails (Admin + Customer) - Parallel, independent
    Promise.allSettled([
      // Admin email
      sendAdminBookingNotification(savedBookingData)
        .then(result => {
          if (result.success) {
            console.log('✅ Admin email sent successfully');
          } else {
            console.error('❌ Admin email failed:', result.error);
          }
        })
        .catch(error => {
          console.error('❌ Admin email error:', error.message);
        }),
      
      // Customer email
      sendBookingCustomerConfirmation(
        {
          first_name: savedBookingData.first_name,
          last_name: savedBookingData.last_name,
          email: savedBookingData.email,
          address: savedBookingData.address,
          schedule_date: savedBookingData.schedule_date
        },
        {
          booking_number: bookingNumber,
          selected_service: savedBookingData.selected_service,
          totalPrice: pricingData?.totalPrice
        }
      )
        .then(result => {
          if (result.success) {
            console.log('✅ Customer email sent successfully');
          } else {
            console.error('❌ Customer email failed:', result.error);
          }
        })
        .catch(error => {
          console.error('❌ Customer email error:', error.message);
        })
    ]);

    // TRIGGER 2: ConnectTeam Auto-Upload - Independent (triggers after response sent)
    try {
      const adminBaseUrl = process.env.ADMIN_BASE_URL || process.env.NEXT_PUBLIC_ADMIN_URL;
      if (adminBaseUrl && bookingNumber && typeof fetch === 'function') {
        res.on('finish', () => {
          fetch(`${adminBaseUrl}/api/connectteam/auto-upload/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingNumber })
          })
          .then(async (r) => {
            if (!r.ok) {
              const t = await r.text().catch(() => '');
              console.error('❌ ConnectTeam auto-upload failed:', r.status, t);
            } else {
              console.log('✅ ConnectTeam auto-upload triggered successfully');
            }
          })
          .catch((e) => {
            console.error('❌ ConnectTeam auto-upload error:', e?.message || e);
          });
        });
      } else if (!bookingNumber) {
        console.warn('⚠️ ConnectTeam auto-upload skipped: missing bookingNumber');
      } else if (!adminBaseUrl) {
        console.warn('⚠️ ConnectTeam auto-upload skipped: ADMIN_BASE_URL not set');
      }
    } catch (triggerErr) {
      console.error('❌ ConnectTeam auto-upload unexpected error:', triggerErr?.message || triggerErr);
    }

    // TRIGGER 3: Save Notification to Database - Independent
    saveMainBookingNotificationToDatabase({
      ...savedBookingData,
      pricing: pricingData
    })
      .then(() => {
        console.log('✅ Notification saved to database');
      })
      .catch(error => {
        console.error('❌ Notification database save failed:', error.message);
      });

  } catch (error) {
    console.error('❌ Booking creation error:', error);
    
    res.status(500).json({
      success: false,
      bookingNumber: '',
      status: 'error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

// GET /api/bookings/:bookingNumber - Get booking by number
router.get('/:bookingNumber', async (req, res) => {
  try {
    const { bookingNumber } = req.params;
    

    // Retrieve from normalized database
    const booking = await getNormalizedBookingByNumber(bookingNumber);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Return the complete booking data (already formatted by getNormalizedBookingByNumber)
    res.status(200).json({
      success: true,
      bookingNumber: booking.booking_number,
      status: booking.status,
      selectedService: booking.selected_service,
      customerDetails: {
        firstName: booking.first_name,
        lastName: booking.last_name,
        email: booking.email,
        phone: booking.phone,
        address: booking.address,
        postcode: booking.postcode,
        suburb: booking.suburb,
        scheduleDate: booking.schedule_date,
        notes: booking.notes,
        ndisDetails: booking.ndis_number || booking.plan_manager ? {
          ndisNumber: booking.ndis_number,
          planManager: booking.plan_manager
        } : null,
        commercialDetails: booking.business_name || booking.business_type || booking.abn || booking.contact_person ? {
          businessName: booking.business_name,
          businessType: booking.business_type,
          abn: booking.abn,
          contactPerson: booking.contact_person
        } : null,
        endOfLeaseDetails: booking.end_of_lease_role ? {
          role: booking.end_of_lease_role
        } : null
      },
      serviceDetails: booking.serviceDetails,
      pricing: booking.pricing,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    });

  } catch (error) {
    console.error('❌ Get booking error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking'
    });
  }
});

module.exports = router;