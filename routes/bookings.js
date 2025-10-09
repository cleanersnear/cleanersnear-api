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

    // Send email notifications (admin + customer) - async, don't block response
    handleEmailNotifications(result)
      .catch(error => {
        // Don't throw error - booking was successful, notifications are secondary
        console.error('⚠️ Notification error (non-critical):', error.message);
      });
    
    res.status(200).json(result);

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
 * Sends both admin notification and customer confirmation
 * This function runs asynchronously and doesn't block the booking response
 * @param {Object} bookingResult - Result from createNormalizedBooking
 */
async function handleEmailNotifications(bookingResult) {
  try {
    const { bookingNumber, data: bookingData } = bookingResult;
    
    if (!bookingData) {
      console.error('❌ No booking data available for notification');
      return;
    }

    // === ADMIN NOTIFICATION ===
    // 1. Log the admin notification attempt in database
    const adminNotificationLog = await logNotification({
      booking_id: bookingData.id,
      booking_number: bookingNumber,
      notification_type: 'booking_created_admin',
      title: `New Booking Created - ${bookingNumber}`,
      message: `A new ${bookingData.selected_service} booking has been created for ${bookingData.first_name} ${bookingData.last_name}`,
      delivery_method: 'email',
      recipient_email: process.env.SENDGRID_BUSINESS_EMAIL,
      status: 'pending'
    });

    if (adminNotificationLog.success) {
      const adminNotificationId = adminNotificationLog.notificationId;

      // 2. Send email to admin
      const adminEmailResult = await sendAdminBookingNotification(bookingData);

      if (adminEmailResult.success) {
        // 3. Update notification status to sent
        await updateNotificationStatus(adminNotificationId, {
          status: 'sent',
          external_id: adminEmailResult.messageId,
          external_status: `Admin email sent successfully (Status: ${adminEmailResult.statusCode})`,
          sent_at: new Date().toISOString()
        });

        console.log('📧 Admin notification email sent:', {
          recipient: process.env.SENDGRID_BUSINESS_EMAIL,
          bookingNumber: bookingNumber,
          messageId: adminEmailResult.messageId
        });

      } else {
        // 4. Update notification status to failed
        await updateNotificationStatus(adminNotificationId, {
          status: 'failed',
          error_message: adminEmailResult.error,
          retry_count: 1
        });

        console.error('❌ Admin email failed:', adminEmailResult.error);
      }
    }

    // === CUSTOMER CONFIRMATION ===
    // 5. Log the customer notification attempt
    const customerNotificationLog = await logNotification({
      booking_id: bookingData.id,
      booking_number: bookingNumber,
      notification_type: 'booking_confirmation_customer',
      title: `Booking Confirmation - ${bookingNumber}`,
      message: `Booking confirmation sent to ${bookingData.first_name} ${bookingData.last_name}`,
      delivery_method: 'email',
      recipient_email: bookingData.email,
      status: 'pending'
    });

    if (customerNotificationLog.success) {
      const customerNotificationId = customerNotificationLog.notificationId;

      // 6. Send confirmation email to customer
      const customerEmailResult = await sendBookingCustomerConfirmation(
        {
          first_name: bookingData.first_name,
          last_name: bookingData.last_name,
          email: bookingData.email,
          address: bookingData.address
        },
        {
          booking_number: bookingNumber,
          selected_service: bookingData.selected_service,
          schedule_date: bookingData.schedule_date,
          totalPrice: bookingData.pricing?.totalPrice
        }
      );

      if (customerEmailResult.success) {
        // 7. Update notification status to sent
        await updateNotificationStatus(customerNotificationId, {
          status: 'sent',
          external_id: customerEmailResult.messageId,
          external_status: `Customer confirmation sent successfully`,
          sent_at: new Date().toISOString()
        });

        console.log('📧 Customer confirmation email sent:', {
          recipient: bookingData.email,
          bookingNumber: bookingNumber,
          messageId: customerEmailResult.messageId
        });

      } else {
        // 8. Update notification status to failed
        await updateNotificationStatus(customerNotificationId, {
          status: 'failed',
          error_message: customerEmailResult.error,
          retry_count: 1
        });

        console.error('❌ Customer confirmation email failed:', customerEmailResult.error);
      }
    }

  } catch (error) {
    console.error('❌ Email notification error:', error);
    
    // Try to log the error in notification table if possible
    try {
      await logNotification({
        booking_id: bookingResult.data?.id || null,
        booking_number: bookingResult.bookingNumber || 'unknown',
        notification_type: 'notification_error',
        title: 'Email Notification Error',
        message: `Failed to send email notifications: ${error.message}`,
        delivery_method: 'internal',
        status: 'failed',
        error_message: error.message
      });
    } catch (logError) {
      // Silent fail
      console.error('⚠️ Could not log notification error:', logError.message);
    }
  }
}

module.exports = router;