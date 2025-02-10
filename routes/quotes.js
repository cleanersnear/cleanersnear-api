import express from 'express';
import { supabase } from '../config/supabase.js';
import { emailService } from '../services/emailService.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
    try {
        console.log('Received quote request:', req.body);

        const {
            serviceType,
            cleaningType,
            frequency,
            propertyType,
            bedrooms,
            bathrooms,
            rateType,
            preferredDate,
            preferredTime,
            parkingAvailable,
            access,
            name,
            companyName,
            email,
            phone,
            streetAddress,
            suburb,
            state,
            postCode,
            notes
        } = req.body;

        // Validate required fields
        if (!serviceType || !name || !email || !phone || !streetAddress || !suburb || !state || !postCode) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('quotes')
            .insert([
                {
                    service_type: serviceType,
                    cleaning_type: cleaningType,
                    frequency,
                    property_type: propertyType,
                    bedrooms,
                    bathrooms,
                    rate_type: rateType,
                    preferred_date: preferredDate,
                    preferred_time: preferredTime,
                    parking_available: parkingAvailable,
                    access,
                    name,
                    company_name: companyName,
                    email,
                    phone,
                    street_address: streetAddress,
                    suburb,
                    state,
                    post_code: postCode,
                    notes,
                    status: 'new',
                    created_at: new Date().toISOString(),
                    ip_address: req.ip || req.connection.remoteAddress,
                    user_agent: req.headers['user-agent']
                }
            ])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Send email notifications
        try {
            await Promise.all([
                emailService.sendQuoteBusinessNotification(req.body),
                emailService.sendQuoteCustomerConfirmation(req.body)
            ]);
        } catch (emailError) {
            console.error('Email notification error:', emailError);
            // Continue with the response even if email fails
        }

        console.log('Successfully processed quote request:', data);

        res.status(201).json({
            success: true,
            message: 'Thank you! Your quote request has been submitted successfully.',
            data
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Something went wrong. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
});

export default router; 