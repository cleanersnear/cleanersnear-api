import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

const carpetCleaningHandler = {
    processBooking: async ({ bookingId, serviceDetails }) => {
        try {
            // Destructure exactly as per frontend interface
            const {
                carpetCleaning: {
                    enabled,
                    bedrooms,
                    livingRooms,
                    studyRooms,
                    hallways,
                    stairs,
                    customRooms
                },
                rugCleaning: {
                    enabled: rugEnabled,
                    large,
                    medium,
                    small
                },
                upholsteryCleaning: {
                    enabled: upholsteryEnabled,
                    sofa,
                    chair,
                    mattress
                },
                additionalNotes,
                totalPrice,
                priceBreakdown
            } = serviceDetails;

            // Save to carpet cleaning services table
            const { data: serviceData, error: serviceError } = await supabase
                .from('carpet_cleaning_services')
                .insert({
                    booking_id: bookingId,
                    carpet_cleaning: {
                        enabled,
                        bedrooms,
                        livingRooms,
                        studyRooms,
                        hallways,
                        stairs,
                        customRooms
                    },
                    rug_cleaning: {
                        enabled: rugEnabled,
                        large,
                        medium,
                        small
                    },
                    upholstery_cleaning: {
                        enabled: upholsteryEnabled,
                        sofa,
                        chair,
                        mattress
                    },
                    additional_notes: additionalNotes,
                    total_price: totalPrice,
                    price_breakdown: priceBreakdown,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (serviceError) {
                throw serviceError;
            }

            return {
                success: true,
                totalPrice,
                serviceConfig: {
                    carpetCleaning: serviceData.carpet_cleaning,
                    rugCleaning: serviceData.rug_cleaning,
                    upholsteryCleaning: serviceData.upholstery_cleaning
                }
            };
        } catch (error) {
            console.error('Carpet cleaning processing error:', error);
            throw new Error(`Failed to process carpet cleaning booking: ${error.message}`);
        }
    }
};

// POST route using the handler
router.post('/submit', carpetCleaningHandler.processBooking);

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

// Export the processBooking function
router.processBooking = carpetCleaningHandler.processBooking;
export default router; 