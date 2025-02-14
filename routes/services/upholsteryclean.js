import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const upholsteryCleanHandler = {
    processBooking: async ({ bookingId, serviceDetails }) => {
        try {
            // Map the frontend data structure to database columns
            const { data: serviceData, error: serviceError } = await supabase
                .from('upholstery_cleaning_services')
                .insert({
                    booking_id: bookingId,
                    
                    // Sofa details
                    sofa_enabled: serviceDetails.upholsteryCleaning.sofa.enabled,
                    sofa_large_count: serviceDetails.upholsteryCleaning.sofa.large,
                    sofa_medium_count: serviceDetails.upholsteryCleaning.sofa.medium,
                    sofa_small_count: serviceDetails.upholsteryCleaning.sofa.small,
                    
                    // Chair details
                    chair_enabled: serviceDetails.upholsteryCleaning.chair.enabled,
                    chair_recliner_count: serviceDetails.upholsteryCleaning.chair.recliner,
                    chair_day_count: serviceDetails.upholsteryCleaning.chair.dayChair,
                    chair_arm_count: serviceDetails.upholsteryCleaning.chair.armChair,
                    chair_ottoman_count: serviceDetails.upholsteryCleaning.chair.ottoman,
                    
                    // Mattress details
                    mattress_enabled: serviceDetails.upholsteryCleaning.mattress.enabled,
                    mattress_large_count: serviceDetails.upholsteryCleaning.mattress.large,
                    mattress_medium_count: serviceDetails.upholsteryCleaning.mattress.medium,
                    mattress_small_count: serviceDetails.upholsteryCleaning.mattress.small,
                    
                    // Additional details
                    additional_notes: serviceDetails.additionalNotes,
                    
                    // Pricing
                    total_price: serviceDetails.pricing.totalPrice,
                    price_breakdown: serviceDetails.pricing.priceBreakdown
                })
                .select()
                .single();

            if (serviceError) throw serviceError;

            return {
                success: true,
                message: 'Upholstery cleaning service created successfully',
                data: {
                    bookingId,
                    totalPrice: serviceData.total_price,
                    serviceConfig: serviceData
                }
            };

        } catch (error) {
            console.error('Upholstery cleaning processing error:', error);
            throw error;
        }
    }
};

// POST route using the handler
router.post('/submit', async (req, res) => {
    try {
        const result = await upholsteryCleanHandler.processBooking(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create upholstery cleaning service',
            error: error.message
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Upholstery cleaning API is working'
    });
});

// Export both router and handler
router.processBooking = upholsteryCleanHandler.processBooking;
export default router; 