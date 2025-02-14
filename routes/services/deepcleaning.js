import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions 
const deepCleaningHandler = {
    processBooking: async ({ bookingId, serviceDetails }) => {
        try {
            // Map the frontend data structure to database columns
            const { data: serviceData, error: serviceError } = await supabase
                .from('deep_cleaning_services')
                .insert({
                    booking_id: bookingId,
                    home_size: serviceDetails.homeSize,
                    
                    // Map individual cleaning areas
                    kitchen_clean: serviceDetails.cleaningAreas.kitchen,
                    oven_clean: serviceDetails.cleaningAreas.oven,
                    bathroom_clean: serviceDetails.cleaningAreas.bathroom,
                    bedroom_clean: serviceDetails.cleaningAreas.bedroom,
                    toilet_clean: serviceDetails.cleaningAreas.toilet,
                    lounge_clean: serviceDetails.cleaningAreas.lounge,
                    hallway_clean: serviceDetails.cleaningAreas.hallway,
                    stairs_clean: serviceDetails.cleaningAreas.stairs,
                    
                    // Map custom area
                    custom_area_enabled: serviceDetails.cleaningAreas.customArea.enabled,
                    custom_area_description: serviceDetails.cleaningAreas.customArea.description,
                    
                    // Map hours
                    hours_selected: serviceDetails.hours.selected,
                    custom_hours: serviceDetails.hours.customHours,
                    
                    // Map pricing details
                    hourly_rate: serviceDetails.hourlyRate,
                    total_price: serviceDetails.totalPrice,
                    price_breakdown: serviceDetails.priceBreakdown,
                    
                    // Additional notes if any
                    additional_notes: serviceDetails.additionalNotes
                })
                .select()
                .single();

            if (serviceError) throw serviceError;

            // Transform database response back to frontend format
            const responseData = {
                success: true,
                totalPrice: serviceData.total_price,
                serviceConfig: {
                    homeSize: serviceData.home_size,
                    cleaningAreas: {
                        kitchen: serviceData.kitchen_clean,
                        oven: serviceData.oven_clean,
                        bathroom: serviceData.bathroom_clean,
                        bedroom: serviceData.bedroom_clean,
                        toilet: serviceData.toilet_clean,
                        lounge: serviceData.lounge_clean,
                        hallway: serviceData.hallway_clean,
                        stairs: serviceData.stairs_clean,
                        customArea: {
                            enabled: serviceData.custom_area_enabled,
                            description: serviceData.custom_area_description
                        }
                    },
                    hours: {
                        selected: serviceData.hours_selected,
                        customHours: serviceData.custom_hours
                    },
                    hourlyRate: serviceData.hourly_rate,
                    totalPrice: serviceData.total_price,
                    priceBreakdown: serviceData.price_breakdown
                }
            };

            return responseData;

        } catch (error) {
            console.error('Deep cleaning processing error:', error);
            throw error;
        }
    }
};

// POST route using the handler
router.post('/submit', async (req, res) => {
    try {
        const result = await deepCleaningHandler.processBooking(req.body);
        res.status(201).json({
            success: true,
            message: 'Deep cleaning service created successfully',
            data: result
        });
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create deep cleaning service',
            error: error.message
        });
    }
});

// Helper function to generate booking number
async function generateBookingNumber() {
    try {
        const { data: latestBooking } = await supabase
            .from('bookings')
            .select('booking_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNumber = 1;
        if (latestBooking?.[0]) {
            nextNumber = parseInt(latestBooking[0].booking_number.split('-')[1]) + 1;
        }

        return `DPC-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
        console.error('Error generating booking number:', error);
        throw error;
    }
}

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Deep cleaning API is working'
    });
});

// Export both router and processBooking function for bookings.js
router.processBooking = deepCleaningHandler.processBooking;
export default router; 