import express from 'express';
import { supabase } from '../config/supabase.js';
import { emailService } from '../services/emailService.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
    try {
        console.log('Received cost calculator request:', req.body);

        const {
            service,
            typeOfClean,
            phone,
            name,
            address,
            email,
            notes
        } = req.body;

        // Validate required fields
        if (!service || !typeOfClean || !phone || !name || !address || !email) {
            console.log('Validation failed:', { service, typeOfClean, phone, name, address, email });
            return res.status(400).json({
                success: false,
                message: 'All fields are required except notes'
            });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('costcalculator')
            .insert([
                {
                    service,
                    type_of_clean: typeOfClean,
                    phone,
                    name,
                    address,
                    email,
                    notes,
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
                emailService.sendCostCalculatorBusinessNotification(req.body),
                emailService.sendCostCalculatorCustomerConfirmation(req.body)
            ]);
        } catch (emailError) {
            console.error('Email notification error:', emailError);
            // Continue with the response even if email fails
        }

        console.log('Successfully processed cost calculator request:', data);

        res.status(201).json({
            success: true,
            message: 'Thank you! We will send you the cost calculation shortly.',
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