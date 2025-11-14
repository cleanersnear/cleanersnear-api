const emailService = require('../../services/emailService');
const { supabaseOld } = require('../../config/oldSupabase');

// Save quick booking notification to database (legacy DB)
const saveQuickNotificationToDatabase = async (customerDetails, bookingDetails) => {
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
};

// Save main booking notification to database
const saveMainBookingNotificationToDatabase = async (bookingData) => {
  const { error } = await supabaseOld
    .from('notifications')
    .insert({
      type: 'new_main_booking',
      title: 'New Booking Received',
      content: `New booking #${bookingData.booking_number} from ${bookingData.first_name} ${bookingData.last_name}`,
      status: 'unread',
      metadata: {
        customerName: `${bookingData.first_name} ${bookingData.last_name}`,
        bookingNumber: bookingData.booking_number,
        serviceType: bookingData.selected_service,
        scheduledDate: bookingData.schedule_date,
        customerEmail: bookingData.email,
        customerPhone: bookingData.phone,
        totalPrice: bookingData.pricing?.totalPrice,
        address: bookingData.address,
        suburb: bookingData.suburb,
        postcode: bookingData.postcode
      },
      created_at: new Date().toISOString()
    });

  if (error) throw error;
};

// Quick booking notification handler (minimal)
const handleQuickBookingNotification = async (customerDetails, bookingDetails) => {
  try {
    await emailService.sendQuickBookingAdminNotification(customerDetails, bookingDetails);
    await saveQuickNotificationToDatabase(customerDetails, bookingDetails);
    await emailService.sendQuickBookingCustomerConfirmation(customerDetails, bookingDetails);
  } catch (error) {
    console.error('Error in quick booking notification handler:', error);
  }
};

// Main booking notification handler
const handleMainBookingNotification = async (bookingData, bookingNumber) => {
  try {
    console.log('📧 Starting main booking notification process');
    
    // Parse pricing if it's a JSON string
    let pricingData = bookingData.pricing;
    if (typeof pricingData === 'string') {
      try {
        pricingData = JSON.parse(pricingData);
      } catch {
        console.warn('⚠️ Could not parse pricing data');
      }
    }
    bookingData.pricing = pricingData;
    
    // Send admin email
    await emailService.sendAdminBookingNotification(bookingData);
    
    // Save notification to database
    await saveMainBookingNotificationToDatabase(bookingData);
    
    // Send customer email
    await emailService.sendBookingCustomerConfirmation(
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
    
    console.log('✅ Main booking notification process completed');
  } catch (error) {
    console.error('Error in main booking notification handler:', error);
  }
};

module.exports = { 
  handleQuickBookingNotification,
  handleMainBookingNotification,
  saveMainBookingNotificationToDatabase,
  saveQuickNotificationToDatabase
};
