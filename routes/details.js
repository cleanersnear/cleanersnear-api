import express from 'express';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';

const router = express.Router();

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

// Get the base URL for internal API calls
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? `http://localhost:${process.env.PORT || 8080}`
    : `http://localhost:${process.env.PORT || 5000}`;

// Helper function to get service route based on service type
const getServiceHandler = async (serviceType, serviceDetails, bookingId) => {
    try {
        const { data, error } = await supabase
            .from(`${serviceType}_services`)
            .insert({
                booking_id: bookingId,
                ...serviceDetails
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Error in ${serviceType} service handler:`, error);
        throw error;
    }
};

// POST: Submit booking details
router.post('/submit', async (req, res) => {
    try {
        const { customerDetails, serviceDetails } = req.body;
        console.log('Processing booking submission:', {
            customerType: 'customer',
            serviceType: serviceDetails.type
        });

        // 1. Create/Update Customer Record
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .upsert([{
                first_name: customerDetails.firstName,
                last_name: customerDetails.lastName,
                email: customerDetails.email,
                phone: customerDetails.phone,
                address: customerDetails.address
            }])
            .select()
            .single();

        if (customerError) {
            console.error('Customer creation error:', customerError);
            throw customerError;
        }

        // 2. Generate booking number
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
        const bookingNumber = `ONL-${nextNumber.toString().padStart(4, '0')}`;

        // 3. Create Booking Record
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert([{
                booking_number: bookingNumber,
                customer_id: customer.id,
                service_type: serviceDetails.type,
                status: 'pending',
                date: customerDetails.date || null,
                time: customerDetails.time || 'flexible',
                is_flexible_date: customerDetails.isFlexibleDate,
                is_flexible_time: customerDetails.isFlexibleTime,
                total_price: serviceDetails.price
            }])
            .select()
            .single();

        if (bookingError) {
            console.error('Booking creation error:', bookingError);
            throw bookingError;
        }

        // 4. Forward to specific service handler
        const serviceUrl = `${API_BASE_URL}/api/services/${serviceDetails.type}/submit`;
        console.log('Forwarding to service handler:', serviceUrl);

        try {
            const serviceResponse = await fetch(serviceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                    serviceDetails: serviceDetails.details
                })
            });

            // Add response logging
            const responseText = await serviceResponse.text();
            console.log('Service response status:', serviceResponse.status);
            console.log('Service response headers:', serviceResponse.headers);
            console.log('Service response body:', responseText);

            if (!serviceResponse.ok) {
                // Rollback booking if service creation fails
                await supabase
                    .from('bookings')
                    .delete()
                    .match({ id: booking.id });
                
                throw new Error(`Service creation failed: ${responseText}`);
            }

            const serviceData = JSON.parse(responseText);

            // 5. Return success response with booking confirmation
            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: {
                    bookingId: booking.id,
                    bookingNumber: booking.booking_number,
                    customerId: customer.id,
                    serviceType: serviceDetails.type,
                    status: 'pending',
                    totalPrice: serviceDetails.price,
                    // Include customer details for confirmation page
                    firstName: customer.first_name,
                    lastName: customer.last_name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customerDetails.address,
                    date: customerDetails.date,
                    time: customerDetails.time,
                    isFlexibleDate: customerDetails.isFlexibleDate,
                    isFlexibleTime: customerDetails.isFlexibleTime,
                    // Include service details
                    service: {
                        type: serviceDetails.type,
                        price: serviceDetails.price,
                        details: serviceData.data
                    }
                }
            });

        } catch (error) {
            console.error('Error processing service:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process service',
                error: error.message
            });
        }

    } catch (error) {
        console.error('Error processing booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process booking',
            error: error.message
        });
    }
});

export default router; 