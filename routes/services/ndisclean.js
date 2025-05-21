import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const ndisCleanHandler = {
    processBooking: async ({ bookingId, serviceDetails }) => {
        try {
            // Map the frontend data structure to database columns
            const { data: serviceData, error: serviceError } = await supabase
                .from('ndis_cleaning_services')
                .insert({
                    booking_id: bookingId,
                    
                    // Property details
                    home_size: serviceDetails.propertyDetails.size,
                    bathrooms: serviceDetails.propertyDetails.bathrooms,
                    toilets: serviceDetails.propertyDetails.toilets,
                    property_type: serviceDetails.propertyDetails.propertyType,
                    has_pets: serviceDetails.propertyDetails.hasPets,
                    
                    // Service frequency
                    frequency_type: serviceDetails.serviceFrequency.type,
                    regular_frequency: serviceDetails.serviceFrequency.regularFrequency,
                    
                    // Hours
                    hours_selected: serviceDetails.hours.selected,
                    custom_hours: serviceDetails.hours.customHours,
                    
                    // NDIS details
                    client_number: serviceDetails.ndisDetails.clientNumber,
                    client_name: serviceDetails.ndisDetails.clientName,
                    case_manager: serviceDetails.ndisDetails.caseManager,
                    funding_company: serviceDetails.ndisDetails.fundingCompany,
                    
                    // Additional options
                    parking_type: serviceDetails.additionalOptions.parkingType,
                    selected_extras: serviceDetails.additionalOptions.selectedExtras,
                    provides_equipment: serviceDetails.additionalOptions.providesEquipment,
                    additional_notes: serviceDetails.additionalOptions.additionalNotes,
                    
                    // Pricing
                    hourly_rate: serviceDetails.pricing.hourlyRate,
                    total_price: serviceDetails.pricing.totalPrice,
                    price_breakdown: serviceDetails.pricing.priceBreakdown
                })
                .select()
                .single();

            if (serviceError) throw serviceError;

            return {
                success: true,
                message: 'NDIS cleaning service created successfully',
                totalPrice: serviceData.total_price,
                data: {
                    bookingId,
                    serviceConfig: serviceData
                }
            };

        } catch (error) {
            console.error('NDIS cleaning processing error:', error);
            throw error;
        }
    }
};

// POST route using the handler
router.post('/submit', async (req, res) => {
    try {
        const result = await ndisCleanHandler.processBooking(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create NDIS cleaning service',
            error: error.message
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'NDIS cleaning API is working'
    });
});

// Export both router and processBooking function for bookings.js
router.processBooking = ndisCleanHandler.processBooking;
export default router; 