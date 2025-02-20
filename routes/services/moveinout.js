import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

const moveInOutHandler = {
    processBooking: async ({ bookingId, serviceDetails }) => {
        try {
            const {
                moveType,
                propertyDetails,
                carpetCleaning,
                kitchenDetails,
                extras,
                hours,
                pricing
            } = serviceDetails;

            // Save to move in/out services table
            const { data: serviceData, error: serviceError } = await supabase
                .from('move_in_out_services')
                .insert({
                    booking_id: bookingId, 
                    move_type: moveType,
                    
                    // Property Details
                    // Make these optional
                    home_size_id: propertyDetails?.homeSize?.id || null,
                    home_size_label: propertyDetails?.homeSize?.label || null,
                    bathrooms: propertyDetails.bathrooms,
                    toilets: propertyDetails.toilets,
                    property_type: propertyDetails.propertyType,
                    is_furnished: propertyDetails.isFurnished,
                    
                    // Carpet Cleaning
                    needs_carpet_cleaning: carpetCleaning?.needed || false,
                    carpet_bedrooms: carpetCleaning?.areas?.bedrooms || 0,
                    carpet_lounge_rooms: carpetCleaning?.areas?.loungeRooms || 0,
                    carpet_has_hallway: carpetCleaning?.areas?.hallway || false,
                    carpet_has_stairs: carpetCleaning?.areas?.stairs || false,
                    carpet_parking_type: carpetCleaning?.parkingType || 'none',
                    carpet_cleaning_cost: carpetCleaning?.cost || 0,
                    
                    // Kitchen Details
                    kitchen_condition: kitchenDetails.condition,
                    kitchen_surcharge: kitchenDetails.surcharge || 0,
                    
                    // Hours
                    service_hours: hours.selected,
                    custom_hours: hours.customHours,
                    
                    // Pricing
                    hourly_rate: pricing.baseRate,
                    base_total: pricing.baseRate * (hours.selected === 'custom' ? hours.customHours : parseInt(hours.selected)),
                    extras_total: extras.totalCost,
                    final_total: pricing.totalPrice
                })
                .select()
                .single();

            if (serviceError) {
                throw serviceError;
            }

            return {
                success: true,
                totalPrice: serviceData.final_total,
                serviceConfig: serviceData
            };

        } catch (error) {
            console.error('Move in/out processing error:', error);
            throw new Error(`Failed to process move in/out booking: ${error.message}`);
        }
    }
};

// Routes
router.post('/submit', moveInOutHandler.processBooking);

router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Move in/out cleaning API is working'
    });
});

// Export
router.processBooking = moveInOutHandler.processBooking;
export default router; 