import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const moveInOutHandler = {
    processBooking: async (req, res) => {
        try {
            const { customer, booking, serviceDetails } = req.body;
            
            console.log('Starting move in/out cleaning booking process...');

            // 1. Create customer record
            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .insert({
                    first_name: customer.firstName,
                    last_name: customer.lastName,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address
                })
                .select()
                .single();

            if (customerError) {
                console.error('Customer creation error:', customerError);
                throw customerError;
            }
            console.log('✓ Customer created:', customerData);

            // 2. Create booking record
            const bookingNumber = await generateBookingNumber();
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    booking_number: bookingNumber,
                    customer_id: customerData.id,
                    service_type: 'move-in-out',
                    date: booking.date,
                    time: booking.time,
                    is_flexible_date: booking.isFlexibleDate,
                    is_flexible_time: booking.isFlexibleTime,
                    status: 'pending',
                    total_price: booking.totalPrice || serviceDetails.price || 0
                })
                .select()
                .single();

            if (bookingError) {
                console.error('Booking creation error:', bookingError);
                throw bookingError;
            }
            console.log('✓ Booking created:', bookingData);

            // 3. Create service record
            const { data: serviceData, error: serviceError } = await supabase
                .from('move_in_out_services')
                .insert({
                    booking_id: bookingData.id,
                    move_type: serviceDetails.moveType,
                    property_details: serviceDetails.propertyDetails,
                    carpet_cleaning: serviceDetails.carpetCleaning,
                    kitchen_condition: serviceDetails.kitchenCondition,
                    additional_options: serviceDetails.additionalOptions,
                    hours: serviceDetails.hours,
                    extras: serviceDetails.extras,
                    price_breakdown: serviceDetails.priceBreakdown,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (serviceError) {
                console.error('Service creation error:', serviceError);
                throw serviceError;
            }
            console.log('✓ Service details saved:', serviceData);

            // 4. Send success response
            const response = {
                success: true,
                message: 'Move in/out cleaning booking created successfully',
                data: {
                    bookingId: bookingData.id,
                    bookingNumber: bookingNumber,
                    customerReference: customerData.id,
                    serviceReference: serviceData.id,
                    status: 'pending',
                    totalPrice: booking.totalPrice,
                    createdAt: bookingData.created_at,
                    serviceType: 'move-in-out'
                }
            };
            
            console.log('✓ Booking complete:', response);
            res.json(response);

        } catch (error) {
            console.error('Move in/out cleaning error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process move in/out cleaning booking',
                error: error.message
            });
        }
    }
};

// POST route using the handler
router.post('/submit', moveInOutHandler.processBooking);

// Helper function to generate booking number
async function generateBookingNumber() {
    try {
        const { data: latestBooking } = await supabase
            .from('bookings')
            .select('booking_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNumber = 1;
        if (latestBooking && latestBooking.length > 0) {
            const lastNumber = parseInt(latestBooking[0].booking_number.split('-')[1]);
            nextNumber = lastNumber + 1;
        }

        return `ONL-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
        console.error('Error generating booking number:', error);
        throw error;
    }
}

// Add a test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Move in/out cleaning API is working'
    });
});

// Export both router and processBooking function
router.processBooking = moveInOutHandler.processBooking;
export default router; 