const { supabase } = require('../config/database');

/**
 * Log notification in the database
 * @param {Object} notificationData - Notification data to log
 * @returns {Object} - Database operation result
 */
async function logNotification(notificationData) {
  try {
    const {
      booking_id,
      booking_number,
      notification_type,
      title,
      message,
      delivery_method,
      recipient_email,
      recipient_phone,
      status = 'pending',
      external_id,
      external_status,
      error_message,
      retry_count = 0,
      max_retries = 3
    } = notificationData;


    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          booking_id,
          booking_number,
          notification_type,
          title,
          message,
          delivery_method,
          recipient_email,
          recipient_phone,
          status,
          external_id,
          external_status,
          error_message,
          retry_count,
          max_retries
        }
      ])
      .select();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    console.log('📬 Notification sent');

    return {
      success: true,
      notificationId: data[0].id,
      data: data[0]
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update notification status (for tracking email delivery)
 * @param {String} notificationId - Notification ID
 * @param {Object} updateData - Data to update
 * @returns {Object} - Database operation result
 */
async function updateNotificationStatus(notificationId, updateData) {
  try {
    const {
      status,
      external_id,
      external_status,
      error_message,
      sent_at,
      delivered_at,
      retry_count
    } = updateData;


    const updateFields = {};
    if (status) updateFields.status = status;
    if (external_id) updateFields.external_id = external_id;
    if (external_status) updateFields.external_status = external_status;
    if (error_message) updateFields.error_message = error_message;
    if (sent_at) updateFields.sent_at = sent_at;
    if (delivered_at) updateFields.delivered_at = delivered_at;
    if (retry_count !== undefined) updateFields.retry_count = retry_count;

    const { data, error } = await supabase
      .from('notifications')
      .update(updateFields)
      .eq('id', notificationId)
      .select();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data[0]
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get notifications for a specific booking
 * @param {String} bookingNumber - Booking number
 * @returns {Object} - Database operation result
 */
async function getBookingNotifications(bookingNumber) {
  try {

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('booking_number', bookingNumber)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      notifications: data || []
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get notifications by status (for admin monitoring)
 * @param {String} status - Notification status
 * @param {Number} limit - Number of records to return
 * @returns {Object} - Database operation result
 */
async function getNotificationsByStatus(status, limit = 100) {
  try {

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      notifications: data || []
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  logNotification,
  updateNotificationStatus,
  getBookingNotifications,
  getNotificationsByStatus
};
