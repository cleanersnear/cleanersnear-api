import { emailService } from '../../services/emailService.js';
import { supabase } from '../../config/supabase.js';

// 1. Send immediate admin notification
const sendAdminNotification = async (customerDetails, bookingDetails) => {
    try {
        await emailService.sendBookingAdminNotification(customerDetails, bookingDetails);
        console.log('Admin notification email sent successfully');
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
};

// 2. Save notification to database
const saveNotificationToDatabase = async (customerDetails, bookingDetails) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                type: 'new_booking',
                title: 'New Booking Received',
                content: `New booking #${bookingDetails.bookingNumber} from ${customerDetails.firstName} ${customerDetails.lastName}`,
                booking_id: bookingDetails.bookingId,
                status: 'unread',
                metadata: {
                    customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
                    bookingNumber: bookingDetails.bookingNumber,
                    serviceType: bookingDetails.serviceType,
                    scheduledDate: customerDetails.date,
                    scheduledTime: customerDetails.time,
                    customerEmail: customerDetails.email,
                    customerPhone: customerDetails.phone,
                    totalPrice: bookingDetails.totalPrice
                    
                },
                created_at: new Date().toISOString()
            });

        if (error) throw error;
        console.log('Notification saved to database');
    } catch (error) {
        console.error('Error saving notification:', error);
    }
};

// 2. Save quick booking notification to database
const saveQuickNotificationToDatabase = async (customerDetails, bookingDetails) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                type: 'new_quick_booking',
                title: 'New Quick Booking Received',
                content: `New quick booking #${bookingDetails.bookingNumber} from ${customerDetails.firstName} ${customerDetails.lastName}`,
                // Do NOT include booking_id to avoid foreign key constraint for quick bookings
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
        console.log('Quick booking notification saved to database');
    } catch (error) {
        console.error('Error saving quick booking notification:', error);
    }
};

// 3. Send delayed customer confirmation
const sendCustomerConfirmation = async (customerDetails, bookingDetails) => {
    try {
        // Wait for 5 minutes
        

        await emailService.sendBookingCustomerConfirmation(customerDetails, bookingDetails);
        console.log('Customer confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending customer confirmation:', error);
    }
};

// Main notification handler
export const handleBookingNotification = async (customerDetails, bookingDetails) => {
    try {
        // 1. Send immediate admin notification
        await sendAdminNotification(customerDetails, bookingDetails);

        // 2. Save notification to database
        await saveNotificationToDatabase(customerDetails, bookingDetails);

        // 3. Send delayed customer confirmation (non-blocking)
        sendCustomerConfirmation(customerDetails, bookingDetails);

        console.log('All notifications processed successfully');
    } catch (error) {
        console.error('Error in notification handler:', error);
        // Don't throw error - we don't want to affect the main booking flow
    }
};

// Quick booking notification handler
export const handleQuickBookingNotification = async (customerDetails, bookingDetails) => {
    try {
        // 1. Send immediate admin notification
        await emailService.sendQuickBookingAdminNotification(customerDetails, bookingDetails);

        // 2. Save notification to database
        await saveQuickNotificationToDatabase(customerDetails, bookingDetails);

        // 3. Send delayed customer confirmation (non-blocking)
        emailService.sendQuickBookingCustomerConfirmation(customerDetails, bookingDetails);

        console.log('All quick booking notifications processed successfully');
    } catch (error) {
        console.error('Error in quick booking notification handler:', error);
        // Don't throw error - we don't want to affect the main booking flow
    }
}; 
