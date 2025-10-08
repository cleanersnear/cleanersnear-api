const express = require('express');
const { supabaseOld } = require('../config/oldSupabase');
const emailService = require('../services/emailService');

const router = express.Router();

router.post('/submit', async (req, res) => {
    try {
        console.log('Received contact form submission:', req.body);

        const {
            name,
            email,
            phone,
            address,
            subject,
            message
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required except address'
            });
        }

        // Insert into Supabase
        const { data, error } = await supabaseOld
            .from('contact_messages')
            .insert([
                {
                    name,
                    email,
                    phone,
                    address,
                    subject,
                    message,
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
                emailService.sendContactFormBusinessNotification(req.body),
                emailService.sendContactFormCustomerConfirmation(req.body)
            ]);
        } catch (emailError) {
            console.error('Email notification error:', emailError);
            // Continue with the response even if email fails
        }

        console.log('Successfully processed contact form:', data);

        res.status(201).json({
            success: true,
            message: 'Thank you for your message! We will contact you shortly.',
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

module.exports = router; 