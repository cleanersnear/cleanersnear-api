import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const commercialCleanHandler = {
    processBooking: async ({ bookingId, serviceDetails }) => {
        try {
            // Map the frontend data structure to database columns
            const { data: serviceData, error: serviceError } = await supabase
                .from('commercial_cleaning_services')
                .insert({
                    booking_id: bookingId,
                    
                    // Industry and company details
                    industry: serviceDetails.industry,
                    other_industry_type: serviceDetails.otherIndustryType,
                    company_name: serviceDetails.companyDetails.name,
                    company_abn: serviceDetails.companyDetails.abn,
                    
                    // Service frequency
                    frequency_type: serviceDetails.serviceFrequency.type,
                    regular_frequency: serviceDetails.serviceFrequency.regularFrequency,
                    
                    // Service requirements
                    hours_per_visit: serviceDetails.serviceRequirements.hours.perVisit,
                    staff_count: serviceDetails.serviceRequirements.hours.staff.count,
                    staff_hours_each: serviceDetails.serviceRequirements.hours.staff.hoursEach,
                    total_hours: serviceDetails.serviceRequirements.hours.total,
                    requires_after_hours: serviceDetails.serviceRequirements.requiresAfterHours,
                    
                    // Operating hours
                    preferred_cleaning_time: serviceDetails.operatingHours.preferredCleaningTime,
                    start_time: serviceDetails.operatingHours.startTime,
                    
                    // Contact information
                    contact_phone: serviceDetails.contact.phone,
                    contact_email: serviceDetails.contact.email,
                    additional_notes: serviceDetails.contact.message,
                    
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
                message: 'Commercial cleaning service created successfully',
                data: {
                    bookingId,
                    totalPrice: serviceData.total_price,
                    serviceConfig: serviceData
                }
            };

        } catch (error) {
            console.error('Commercial cleaning processing error:', error);
            throw error;
        }
    }
};

// POST route using the handler
router.post('/submit', async (req, res) => {
    try {
        const result = await commercialCleanHandler.processBooking(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create commercial cleaning service',
            error: error.message
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Commercial cleaning API is working'
    });
});

// Export both router and processBooking function for bookings.js
router.processBooking = commercialCleanHandler.processBooking;
export default router; 