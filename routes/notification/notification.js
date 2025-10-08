const { emailService } = require('../../services/emailService');
const { supabaseOld } = require('../../config/oldSupabase');

// Save quick booking notification to database (legacy DB)
const saveQuickNotificationToDatabase = async (customerDetails, bookingDetails) => {
  try {
    const { error } = await supabaseOld
      .from('notifications')
      .insert({
        type: 'new_quick_booking',
        title: 'New Quick Booking Received',
        content: `New quick booking #${bookingDetails.bookingNumber} from ${customerDetails.firstName} ${customerDetails.lastName}`,
        status: 'unread',
        metadata: {
          customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
          bookingNumber: bookingDetails.bookingNumber,
          serviceType: bookingDetails.serviceType,
          scheduledDate: customerDetails.date,
          scheduledTime: customerDetails.time,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          totalPrice: bookingDetails.totalPrice,
          address: customerDetails.address,
          frequency: bookingDetails.frequency,
          minHours: bookingDetails.minHours,
          baseRate: bookingDetails.baseRate,
          totalHours: bookingDetails.totalHours
        },
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving quick booking notification:', error);
  }
};

// Quick booking notification handler (minimal)
const handleQuickBookingNotification = async (customerDetails, bookingDetails) => {
  try {
    await emailService.sendQuickBookingAdminNotification(customerDetails, bookingDetails);
    await saveQuickNotificationToDatabase(customerDetails, bookingDetails);
    emailService.sendQuickBookingCustomerConfirmation(customerDetails, bookingDetails);
  } catch (error) {
    console.error('Error in quick booking notification handler:', error);
  }
};

module.exports = { handleQuickBookingNotification };
