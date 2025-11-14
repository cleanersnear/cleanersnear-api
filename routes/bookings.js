const express = require('express');
const router = express.Router();
const { createNormalizedBooking, getNormalizedBookingByNumber } = require('../database/normalized_bookings');
const { sendAdminBookingNotification, sendBookingCustomerConfirmation } = require('../services/emailService');
const { logNotification, updateNotificationStatus } = require('../database/notifications');

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

    // Send response immediately - booking is successful
    res.status(200).json(result);

    // Run all post-booking tasks independently after response is sent
    // Using Promise.allSettled ensures ALL tasks run even if one fails
    Promise.allSettled([
      // Task 1: Send admin email + customer email + save notifications
      (async () => {
        try {
          await handleEmailNotifications(result);
        } catch (error) {
          console.error('⚠️ Email notifications error (non-critical):', error.message);
        }
      })(),
      
      // Task 2: Trigger ConnectTeam auto-upload
      (async () => {
        try {
          const adminBaseUrl = process.env.ADMIN_BASE_URL || process.env.NEXT_PUBLIC_ADMIN_URL;
          const bookingNumber = result?.bookingNumber;
          
          if (!adminBaseUrl) {
            console.warn('⚠️ ConnectTeam: ADMIN_BASE_URL not set');
            return;
          }
          
          if (!bookingNumber) {
            console.warn('⚠️ ConnectTeam: missing bookingNumber');
            return;
          }
          
          if (typeof fetch !== 'function') {
            console.warn('⚠️ ConnectTeam: fetch not available');
            return;
          }
          
          const response = await fetch(`${adminBaseUrl}/api/connectteam/auto-upload-trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingNumber })
          });
          
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('❌ ConnectTeam auto-upload failed:', response.status, text);
          } else {
            console.log('✅ ConnectTeam auto-upload triggered successfully');
          }
        } catch (error) {
          console.error('❌ ConnectTeam trigger error (non-critical):', error.message);
        }
      })()
    ]).then(() => {
      console.log('✅ All post-booking tasks completed (check logs above for individual results)');
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

/**
 * Handle email notifications after successful booking creation
 * Sends both admin notification and customer confirmation independently
 * This function runs asynchronously and doesn't block the booking response
 * @param {Object} bookingResult - Result from createNormalizedBooking
 */
async function handleEmailNotifications(bookingResult) {
  const { bookingNumber, data: bookingData } = bookingResult;
  
  if (!bookingData) {
    console.error('❌ No booking data available for notification');
    return;
  }

  // Parse pricing once for both emails
  let pricingData = bookingData.pricing;
  if (typeof pricingData === 'string') {
    try {
      pricingData = JSON.parse(pricingData);
    } catch {
      console.warn('⚠️ Could not parse pricing data, using raw value');
    }
  }

  // Run admin and customer emails in parallel - if one fails, other still runs
  const results = await Promise.allSettled([
    // Task 1: Admin email + notification
    sendAdminEmailAndNotify(bookingData, bookingNumber),
    
    // Task 2: Customer email + notification  
    sendCustomerEmailAndNotify(bookingData, bookingNumber, pricingData)
  ]);

  // Log overall results
  console.log('📊 Email notification results:', {
    admin: results[0].status,
    customer: results[1].status
  });
}

/**
 * Send admin email and save notification
 */
async function sendAdminEmailAndNotify(bookingData, bookingNumber) {
  try {
    console.log('📧 Admin email: Starting...');

    // 1. Log notification attempt
    const notificationLog = await logNotification({
      booking_id: bookingData.id,
      booking_number: bookingNumber,
      notification_type: 'admin_notification',
      title: `New Booking Created - ${bookingNumber}`,
      message: `A new ${bookingData.selected_service} booking has been created for ${bookingData.first_name} ${bookingData.last_name}`,
      delivery_method: 'email',
      recipient_email: process.env.SENDGRID_BUSINESS_EMAIL,
      status: 'pending'
    });

    const notificationId = notificationLog.success ? notificationLog.notificationId : null;

    // 2. Send email
    const emailResult = await sendAdminBookingNotification(bookingData);

    // 3. Update notification status
    if (notificationId) {
      await updateNotificationStatus(notificationId, {
        status: emailResult.success ? 'sent' : 'failed',
        external_id: emailResult.messageId,
        external_status: emailResult.success ? `Admin email sent successfully` : undefined,
        error_message: emailResult.error,
        sent_at: emailResult.success ? new Date().toISOString() : undefined,
        retry_count: emailResult.success ? 0 : 1
      });
    }

    if (emailResult.success) {
      console.log('✅ Admin email sent successfully');
    } else {
      console.error('❌ Admin email failed:', emailResult.error);
    }

    return emailResult;
  } catch (error) {
    console.error('❌ Admin email process error:', error.message);
    throw error;
  }
}

/**
 * Send customer email and save notification
 */
async function sendCustomerEmailAndNotify(bookingData, bookingNumber, pricingData) {
  try {
    console.log('📧 Customer email: Starting...');

    // 1. Log notification attempt
    const notificationLog = await logNotification({
      booking_id: bookingData.id,
      booking_number: bookingNumber,
      notification_type: 'customer_confirmation',
      title: `Booking Confirmation - ${bookingNumber}`,
      message: `Booking confirmation sent to ${bookingData.first_name} ${bookingData.last_name}`,
      delivery_method: 'email',
      recipient_email: bookingData.email,
      status: 'pending'
    });

    const notificationId = notificationLog.success ? notificationLog.notificationId : null;

    // 2. Send email
    const emailResult = await sendBookingCustomerConfirmation(
      {
        first_name: bookingData.first_name,
        last_name: bookingData.last_name,
        email: bookingData.email,
        address: bookingData.address,
        schedule_date: bookingData.schedule_date
      },
      {
        booking_number: bookingNumber,
        selected_service: bookingData.selected_service,
        totalPrice: pricingData?.totalPrice
      }
    );

    // 3. Update notification status
    if (notificationId) {
      await updateNotificationStatus(notificationId, {
        status: emailResult.success ? 'sent' : 'failed',
        external_id: emailResult.messageId,
        external_status: emailResult.success ? `Customer confirmation sent successfully` : undefined,
        error_message: emailResult.error,
        sent_at: emailResult.success ? new Date().toISOString() : undefined,
        retry_count: emailResult.success ? 0 : 1
      });
    }

    if (emailResult.success) {
      console.log('✅ Customer email sent successfully');
    } else {
      console.error('❌ Customer email failed:', emailResult.error);
    }

    return emailResult;
  } catch (error) {
    console.error('❌ Customer email process error:', error.message);
    throw error;
  }
}

module.exports = router;