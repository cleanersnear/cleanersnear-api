const express = require('express');
const { supabaseOld } = require('../config/oldSupabase');
const emailService = require('../services/emailService');

const router = express.Router();

router.post('/submit', async (req, res) => {
    try {
        console.log('Received subscription request:', req.body);

        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        try {
            // Check if email already exists
            const { data: existingSubscriber, error: checkError } = await supabaseOld
                .from('subscribers')
                .select()
                .eq('email', email)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
                console.error('Error checking existing subscriber:', checkError);
                throw checkError;
            }

            if (existingSubscriber) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already subscribed'
                });
            }

            // Insert into Supabase
            const { data, error: insertError } = await supabaseOld
                .from('subscribers')
                .insert([
                    {
                        email,
                        status: 'active',
                        created_at: new Date().toISOString(),
                        ip_address: req.ip || req.connection.remoteAddress,
                        user_agent: req.headers['user-agent'],
                        updated_at: new Date().toISOString()
                    }
                ])
                .select();

            if (insertError) {
                console.error('Error inserting subscriber:', insertError);
                throw insertError;
            }

            // Send email notifications
            try {
                await Promise.all([
                    emailService.sendSubscriptionConfirmation({ email }),
                    emailService.sendSubscriptionNotification({ email })
                ]);
            } catch (emailError) {
                console.error('Email notification error:', emailError);
                // Continue with the response even if email fails
            }

            console.log('Successfully processed subscription:', data);

            res.status(201).json({
                success: true,
                message: 'Thank you for subscribing!',
                data
            });

        } catch (dbError) {
            if (dbError.code === '42501') { // Permission denied error
                console.error('RLS policy error:', dbError);
                throw new Error('Permission denied. Please check database policies.');
            }
            throw dbError;
        }

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