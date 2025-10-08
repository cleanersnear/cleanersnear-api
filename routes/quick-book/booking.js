const { Router } = require('express');
const { supabaseOld } = require('../../config/oldSupabase');
const { handleQuickBookingNotification } = require('../notification/notification');

const router = Router();

// Helper function to generate booking number
async function generateBookingNumber() {
    const { data: latestBooking } = await supabaseOld
        .from('quick_bookings')
        .select('booking_number')
        .order('created_at', { ascending: false })
        .limit(1);

    let nextNumber = 1;
    if (latestBooking?.[0]) {
        // Extract number from "QBK-XXXX" format
        const lastNumber = parseInt(latestBooking[0].booking_number.split('-')[1]);
        nextNumber = lastNumber + 1;
    }

    return `QBK-${nextNumber.toString().padStart(4, '0')}`;
}

router.post('/', async (req, res) => {
    try {
        const booking = req.body;
        if (!booking || !booking.contactInfo || !booking.contactInfo.email) {
            return res.status(400).json({ success: false, message: 'Missing required booking/contact info' });
        }

        // Generate booking number first
        const bookingNumber = await generateBookingNumber();

        // 1. Create booking first to get the ID
        const bookingInsert = {
            booking_number: bookingNumber,
            booking_type: booking.bookingType,
            frequency: booking.frequency,
            booking_category: booking.bookingCategory,
            service_type: booking.serviceType,
            min_hours: booking.minHours,
            min_amount: booking.minAmount,
            base_rate: booking.baseRate,
            extra_hours: booking.extraHours,
            total_hours: booking.totalHours,
            total_price: booking.totalPrice,
            address_street: booking.address?.street,
            address_suburb: booking.address?.suburb,
            address_state: booking.address?.state,
            address_postcode: booking.address?.postcode,
            address_additional_info: booking.address?.additionalInfo,
            preferred_date: booking.bookingPreferences?.preferredDate,
            time_preference: booking.bookingPreferences?.timePreference,
            created_at: new Date().toISOString(),
        };

        const { data: bookingData, error: bookingError } = await supabaseOld
            .from('quick_bookings')
            .insert([bookingInsert])
            .select()
            .single();

        if (bookingError) {
            return res.status(500).json({ success: false, message: 'Failed to create booking', error: bookingError.message });
        }

        let customerId;

        // 2. Handle customer based on authentication status
        if (booking.isAuthenticated && booking.customerId) {
            // User is authenticated - use existing customer
            customerId = booking.customerId;
            
            // Optionally update customer info if provided (in case user updated their details)
            if (booking.contactInfo || booking.address) {
                const updateData = {};
                
                if (booking.contactInfo) {
                    if (booking.contactInfo.firstName) updateData.first_name = booking.contactInfo.firstName;
                    if (booking.contactInfo.lastName) updateData.last_name = booking.contactInfo.lastName;
                    if (booking.contactInfo.phone) updateData.phone = booking.contactInfo.phone;
                }
                
                if (booking.address) {
                    if (booking.address.street) updateData.street = booking.address.street;
                    if (booking.address.suburb) updateData.suburb = booking.address.suburb;
                    if (booking.address.state) updateData.state = booking.address.state;
                    if (booking.address.postcode) updateData.postcode = booking.address.postcode;
                    if (booking.address.additionalInfo) updateData.additional_info = booking.address.additionalInfo;
                }
                
                // Only update if there's data to update
                if (Object.keys(updateData).length > 0) {
                    const { error: updateError } = await supabaseOld
                        .from('quick_customers')
                        .update(updateData)
                        .eq('id', customerId);
                    
                    if (updateError) {
                        console.error('Error updating customer info:', updateError);
                        // Don't fail the booking if customer update fails
                    }
                }
            }
        } else {
            // User is not authenticated - create or upsert customer
            const { email, firstName, lastName, phone } = booking.contactInfo;
            const address = booking.address || {};
            const { street, suburb, state, postcode, additionalInfo } = address;

            const { data: customer, error: customerError } = await supabaseOld
                .from('quick_customers')
                .upsert([{
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                    street,
                    suburb,
                    state,
                    postcode,
                    additional_info: additionalInfo,
                    created_at: new Date().toISOString()
                }], { onConflict: 'email' })
                .select()
                .single();

            if (customerError) {
                // If customer creation fails, delete the booking
                await supabaseOld
                    .from('quick_bookings')
                    .delete()
                    .eq('id', bookingData.id);
                
                return res.status(500).json({ success: false, message: 'Failed to upsert customer', error: customerError.message });
            }

            customerId = customer.id;
        }

        // 3. Update booking with customer reference
        const { error: updateError } = await supabaseOld
            .from('quick_bookings')
            .update({ customer_id: customerId })
            .eq('id', bookingData.id);

        if (updateError) {
            console.error('Error updating booking with customer ID:', updateError);
            return res.status(500).json({ success: false, message: 'Failed to link booking to customer', error: updateError.message });
        }

        // Trigger notifications after successful booking
        try {
            console.log('Starting notification process for quick booking:', bookingData.booking_number);
            
            await handleQuickBookingNotification(
                // Send customer details
                {
                    firstName: booking.contactInfo.firstName,
                    lastName: booking.contactInfo.lastName,
                    email: booking.contactInfo.email,
                    phone: booking.contactInfo.phone,
                    address: `${booking.address?.street}, ${booking.address?.suburb}, ${booking.address?.state} ${booking.address?.postcode}`,
                    date: booking.bookingPreferences?.preferredDate,
                    time: booking.bookingPreferences?.timePreference,
                    isFlexibleDate: false,
                    isFlexibleTime: false
                },
                // Send booking details
                {
                    bookingId: bookingData.id,
                    bookingNumber: bookingData.booking_number,
                    serviceType: booking.serviceType,
                    status: 'pending',
                    createdAt: bookingData.created_at,
                    location: {
                        suburb: booking.address?.suburb,
                        postcode: booking.address?.postcode,
                        state: booking.address?.state
                    },
                    totalPrice: booking.totalPrice,
                    scheduling: {
                        date: booking.bookingPreferences?.preferredDate,
                        time: booking.bookingPreferences?.timePreference
                    },
                    frequency: booking.frequency,
                    minHours: booking.minHours,
                    baseRate: booking.baseRate,
                    totalHours: booking.totalHours
                }
            );

            console.log('Notification process completed for quick booking:', bookingData.booking_number);
        } catch (notificationError) {
            // Log but don't fail the booking
            console.error('Notification error:', {
                bookingNumber: bookingData.booking_number,
                error: notificationError.message,
                stack: notificationError.stack
            });
        }

        return res.status(201).json({
            success: true,
            bookingId: bookingData.id,
            bookingNumber: bookingData.booking_number,
            booking_number: bookingData.booking_number, // Include both formats for compatibility
            customerId: customerId,
            isAuthenticated: booking.isAuthenticated || false,
            message: booking.isAuthenticated ? 'Booking created and linked to existing customer' : 'Booking created successfully'
        });

    } catch (error) {
        console.error('Booking error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

module.exports = router;
