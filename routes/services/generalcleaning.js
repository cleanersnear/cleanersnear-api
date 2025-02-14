import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const generalCleaningHandler = {
    processBooking: async ({ bookingId, serviceDetails }) => {
        try {
            console.log('Processing general cleaning details:', { bookingId, serviceDetails });

            // Create service record matching the GeneralCleaningDetails interface
            const { data: serviceData, error: serviceError } = await supabase
                .from('general_cleaning_services')
                .insert({
                    booking_id: bookingId,
                    
                    // Property details
                    property_size: serviceDetails.propertyDetails.size,
                    bathrooms: serviceDetails.propertyDetails.bathrooms,
                    toilets: serviceDetails.propertyDetails.toilets,
                    property_type: serviceDetails.propertyDetails.propertyType,
                    
                    // Service frequency
                    frequency_type: serviceDetails.serviceFrequency.type,
                    regular_frequency: serviceDetails.serviceFrequency.regularFrequency,
                    
                    // Pricing options
                    pricing_type: serviceDetails.pricing.type,
                    hours: serviceDetails.pricing.hours,
                    custom_hours: serviceDetails.pricing.customHours,
                    
                    // Additional options
                    has_pets: serviceDetails.additionalOptions.hasPets,
                    parking_type: serviceDetails.additionalOptions.parkingType,
                    selected_extras: serviceDetails.additionalOptions.selectedExtras,
                    additional_notes: serviceDetails.additionalOptions.additionalNotes,
                    
                    // Pricing
                    total_price: serviceDetails.totalPrice,
                    price_breakdown: serviceDetails.priceBreakdown,
                    
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (serviceError) {
                console.error('Service creation error:', serviceError);
                throw serviceError;
            }

            console.log('General cleaning service created:', serviceData);

            return {
                success: true,
                serviceId: serviceData.id,
                totalPrice: serviceDetails.totalPrice
            };

        } catch (error) {
            console.error('General cleaning processing error:', error);
            throw error;
        }
    }
};

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'General cleaning API is working'
    });
});

// Attach the processBooking function to the router
router.processBooking = generalCleaningHandler.processBooking;

// Export the router
export default router; 