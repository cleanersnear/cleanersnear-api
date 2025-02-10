import express from 'express';
import { supabase } from '../config/supabase.js';
import { emailService } from '../services/emailService.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
    try {
        console.log('Received request body:', req.body);

        const {
            name,
            email,
            phone,
            address,
            service
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !address || !service) {
            console.log('Validation failed:', { name, email, phone, address, service });
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('quickenquiry')
            .insert([
                {
                    name,
                    email,
                    phone,
                    address,
                    service,
                    status: 'new',
                    created_at: new Date().toISOString()
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
                emailService.sendBusinessNotification(req.body),
                emailService.sendCustomerConfirmation(req.body)
            ]);
        } catch (emailError) {
            console.error('Email notification error:', emailError);
            // Continue with the response even if email fails
        }

        console.log('Successfully inserted data:', data);

        res.status(201).json({
            success: true,
            message: 'Thank you! We will contact you shortly.',
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