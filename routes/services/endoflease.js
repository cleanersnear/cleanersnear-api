import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const endOfLeaseHandler = {
    processBooking: async ({ bookingId, serviceDetails }) => {
        try {
            // Validate and destructure service details
            const {
                propertyDetails,
                kitchenCondition,
                carpetCleaning,
                parking,
                additionalInformation,
                extras,
                totalPrice,
                priceBreakdown
            } = serviceDetails;

            // Save to end of lease services table with exact field matching
            const { data: serviceData, error: serviceError } = await supabase
                .from('end_of_lease_services')
                .insert({
                    booking_id: bookingId,
                    property_details: {
                        size: propertyDetails.size,
                        bathrooms: Number(propertyDetails.bathrooms),
                        toilets: Number(propertyDetails.toilets),
                        property_type: propertyDetails.propertyType,
                        is_furnished: Boolean(propertyDetails.isFurnished),
                        has_study_room: Boolean(propertyDetails.hasStudyRoom)
                    },
                    kitchen_condition: {
                        rating: Number(kitchenCondition.rating),
                        cleaning_level: kitchenCondition.cleaningLevel
                    },
                    carpet_cleaning: {
                        required: Boolean(carpetCleaning.required),
                        areas: {
                            bedrooms: Number(carpetCleaning.areas.bedrooms),
                            lounge_rooms: Number(carpetCleaning.areas.loungeRooms),
                            hallway: Boolean(carpetCleaning.areas.hallway),
                            stairs: Boolean(carpetCleaning.areas.stairs)
                        }
                    },
                    parking: {
                        type: parking.type
                    },
                    additional_information: {
                        user_type: additionalInformation.userType,
                        tenancy_duration: additionalInformation.tenancyDuration,
                        has_pets: Boolean(additionalInformation.hasPets),
                        additional_notes: additionalInformation.additionalNotes || ''
                    },
                    extras: extras || [],
                    total_price: Number(totalPrice),
                    price_breakdown: priceBreakdown || {},
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (serviceError) {
                throw serviceError;
            }

            return {
                success: true,
                totalPrice: serviceData.total_price,
                serviceConfig: serviceData
            };

        } catch (error) {
            console.error('End of lease processing error:', error);
            throw new Error(`Failed to process end of lease booking: ${error.message}`);
        }
    }
};

// POST route using the handler
router.post('/submit', endOfLeaseHandler.processBooking);

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
        message: 'End of lease cleaning API is working'
    });
});

// Export the processBooking function
router.processBooking = endOfLeaseHandler.processBooking;
export default router; 