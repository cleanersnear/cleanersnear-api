import express from 'express';
import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { handleBookingNotification } from './notification/notification.js';

// Import service handlers directly
import carpetCleaningHandler from './services/carpetcleaning.js';
import endOfLeaseHandler from './services/endoflease.js';
import generalCleaningHandler from './services/generalcleaning.js';
import deepCleaningHandler from './services/deepcleaning.js';
import moveInOutHandler from './services/moveinout.js';
import ndisCleanHandler from './services/ndisclean.js';
import commercialCleanHandler from './services/commercialclean.js';
import ovenCleanHandler from './services/ovenclean.js';
import renovationCleanHandler from './services/renovationclean.js';
import tileAndFloorHandler from './services/tileandfloorclean.js';
import upholsteryCleanHandler from './services/upholsteryclean.js';
import windowCleanHandler from './services/windowclean.js';


const router = Router();

// Service type mapping for handlers - Match frontend IDs
const SERVICE_HANDLERS = {
    'carpet-cleaning': carpetCleaningHandler,        // Match frontend
    'end-of-lease-cleaning': endOfLeaseHandler,      // Match frontend
    'general-cleaning': generalCleaningHandler,
    'deep-cleaning': deepCleaningHandler,
    'move-in-cleaning': moveInOutHandler,
    'ndis-cleaning': ndisCleanHandler,
    'commercial-cleaning': commercialCleanHandler,
 
    // Other services
    'after-renovation-cleaning': renovationCleanHandler,
    'oven-cleaning': ovenCleanHandler,
    'tile-and-floor-cleaning': tileAndFloorHandler,
    'upholstery-cleaning': upholsteryCleanHandler,
    'window-cleaning': windowCleanHandler
};

// Add unified service type validation
const VALID_SERVICE_TYPES = [
    // Popular services
    'carpet-cleaning',
    'end-of-lease-cleaning',
    'general-cleaning',
    'deep-cleaning',
    'move-in-cleaning',
    'ndis-cleaning',
    'commercial-cleaning',
    // Other services
    'after-renovation-cleaning',
    'oven-cleaning',
    'tile-and-floor-cleaning',
    'upholstery-cleaning',
    'window-cleaning'
];

// Create new booking
router.post('/', async (req, res) => {
    try {
        const {
            serviceType,
            location,
            serviceDetails,
            customerDetails,
            createdAt = new Date().toISOString()
        } = req.body;

        // Add service type validation
        if (!VALID_SERVICE_TYPES.includes(serviceType)) {
            return res.status(400).json({
                success: false,
                message: 'Failed to create booking',
                error: `Invalid service type: ${serviceType}`
            });
        }

        // 1. Generate booking number
        const bookingNumber = await generateBookingNumber();

        // 2. Create basic booking record with corrected location structure
        const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                booking_number: bookingNumber,
                service_type: serviceType,
                status: 'pending', 
                created_at: createdAt,
                location: {
                    suburb: location.name,      // Frontend sends name for suburb
                    postcode: location.postcode,
                    state: location.region      // Frontend sends region for state
                }
            })
            .select()
            .single();

        if (bookingError) throw bookingError;

        // 3. Create customer record
        const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .insert({
                booking_id: bookingData.id,
                first_name: customerDetails.firstName,
                last_name: customerDetails.lastName,
                email: customerDetails.email,
                phone: customerDetails.phone,
                address: customerDetails.address,
                scheduling: {
                    date: customerDetails.date,
                    time: customerDetails.time,
                    is_flexible_date: customerDetails.isFlexibleDate,
                    is_flexible_time: customerDetails.isFlexibleTime
                },
                created_at: createdAt
            })
            .select()
            .single();

        if (customerError) throw customerError;

        // 4. Update booking with customer ID and scheduling
        await supabase
            .from('bookings')
            .update({ 
                customer_id: customerData.id,
                
            })
            .eq('id', bookingData.id);

        // 5. Forward to service-specific handler
        const serviceHandler = SERVICE_HANDLERS[serviceType];
        if (!serviceHandler) {
            throw new Error(`No handler found for service type: ${serviceType}`);
        }

        const serviceResult = await serviceHandler.processBooking({
            bookingId: bookingData.id,
            serviceDetails
        });

        // 6. Update booking with price from service handler
        await supabase
            .from('bookings')
            .update({
                total_price: serviceResult.totalPrice
            })
            .eq('id', bookingData.id);

        // After successful booking creation
        // const result = await processBooking(serviceType, serviceDetails);
        
        // Trigger notifications after successful booking
        // This runs after sending success response to avoid delay
        
        // Instead of process.nextTick, handle notification before sending response
        try {
            console.log('Starting notification process for booking:', bookingData.booking_number);
            
            await handleBookingNotification(
                // Send all customer data
                {
                    firstName: customerDetails.firstName,
                    lastName: customerDetails.lastName,
                    email: customerDetails.email,
                    phone: customerDetails.phone,
                    address: customerDetails.address,
                    date: customerDetails.date,
                    time: customerDetails.time,
                    isFlexibleDate: customerDetails.isFlexibleDate,
                    isFlexibleTime: customerDetails.isFlexibleTime
                }, 
                // Send all booking data
                {
                    bookingId: bookingData.id,
                    bookingNumber: bookingData.booking_number,
                    serviceType: serviceType,
                    status: bookingData.status,
                    createdAt: bookingData.created_at,
                    location: bookingData.location,
                    totalPrice: serviceResult.totalPrice,
                    scheduling: {
                        date: customerDetails.date,
                        time: customerDetails.time,
                        isFlexibleDate: customerDetails.isFlexibleDate,
                        isFlexibleTime: customerDetails.isFlexibleTime
                    }
                }
            );

            console.log('Notification process completed for booking:', bookingData.booking_number);
        } catch (notificationError) {
            // Log but don't fail the booking
            console.error('Notification error:', {
                bookingNumber: bookingData.booking_number,
                error: notificationError.message,
                stack: notificationError.stack
            });
        }


        // 7. Return response matching booking.ts expectations
        return res.status(201).json({
            success: true,
            bookingId: bookingData.id,
            bookingNumber: bookingData.booking_number,
            message: 'Booking created successfully'
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

// Helper function to generate booking number
async function generateBookingNumber() {
    const { data: latestBooking } = await supabase
        .from('bookings')
        .select('booking_number')
        .order('created_at', { ascending: false })
        .limit(1);

    let nextNumber = 1;
    if (latestBooking?.[0]) {
        nextNumber = parseInt(latestBooking[0].booking_number.split('-')[1]) + 1;
    }

    return `BK-${nextNumber.toString().padStart(4, '0')}`;
}

export default router; 