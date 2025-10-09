-- ============================================================================
-- NOTIFICATIONS TABLE FOR EMAIL TRACKING
-- ============================================================================
-- This table tracks all email notifications sent from the system
-- Run this in your Supabase SQL editor to create or update the notifications table

-- Drop existing constraint if it exists and recreate with correct values
ALTER TABLE IF EXISTS notifications 
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Booking Reference
    booking_id UUID,
    booking_number VARCHAR(10),
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'admin_notification',
        'customer_confirmation',
        'quick_booking_admin',
        'quick_booking_customer',
        'subscription_confirmation',
        'subscription_notification',
        'contact_form_admin',
        'contact_form_customer',
        'notification_error'
    )),
    
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Delivery Information
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('email', 'sms', 'internal')),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    
    -- External Service Tracking (e.g., SendGrid)
    external_id VARCHAR(255), -- Message ID from SendGrid
    external_status TEXT,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the constraint if we had to drop it earlier
ALTER TABLE notifications 
ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN (
    'admin_notification',
    'customer_confirmation',
    'quick_booking_admin',
    'quick_booking_customer',
    'subscription_confirmation',
    'subscription_notification',
    'contact_form_admin',
    'contact_form_customer',
    'notification_error'
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_booking_number ON notifications(booking_number);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_timestamp ON notifications;
CREATE TRIGGER update_notifications_timestamp 
BEFORE UPDATE ON notifications 
FOR EACH ROW 
EXECUTE FUNCTION update_notifications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Tracks all email and SMS notifications sent from the system';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: admin_notification, customer_confirmation, etc.';
COMMENT ON COLUMN notifications.external_id IS 'Message ID from external service (e.g., SendGrid message ID)';
COMMENT ON COLUMN notifications.status IS 'Current status: pending, sent, delivered, failed, bounced';

