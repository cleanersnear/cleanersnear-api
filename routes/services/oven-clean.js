import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const ovenCleanHandler = {
    processEnquiry: async (req, res) => {
        try {
            const { formData } = req.body;
            
            console.log('Processing oven cleaning enquiry...');

            // 1. Create enquiry record
            const enquiryNumber = `OVN-${Date.now().toString().slice(-8)}`;
            
            const { data: enquiryData, error: enquiryError } = await supabase
                .from('oven_cleaning_enquiries')
                .insert({
                    enquiry_number: enquiryNumber,
                    contact_info: {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        preferred_contact: formData.preferredContact,
                        preferred_time: formData.preferredTime
                    },
                    property_details: {
                        type: formData.propertyType,
                        address: {
                            street: formData.address.street,
                            unit: formData.address.unit,
                            suburb: formData.address.suburb,
                            state: formData.address.state,
                            postcode: formData.address.postcode
                        }
                    },
                    oven_details: {
                        type: formData.ovenType,
                        expected_date: formData.expectedDate,
                        additional_notes: formData.additionalNotes
                    },
                    status: 'pending',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (enquiryError) {
                console.error('Enquiry creation error:', enquiryError);
                throw enquiryError;
            }

            console.log('✓ Enquiry created:', enquiryData);

            // Send success response
            const response = {
                success: true,
                message: 'Oven cleaning enquiry submitted successfully',
                data: {
                    enquiryNumber: enquiryNumber,
                    status: 'pending',
                    expectedContact: '24 hours',
                    createdAt: enquiryData.created_at
                }
            };
            
            res.json(response);

        } catch (error) {
            console.error('Oven cleaning enquiry error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit oven cleaning enquiry',
                error: error.message
            });
        }
    }
};

// POST route for enquiry submission
router.post('/submit-enquiry', ovenCleanHandler.processEnquiry);

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Oven cleaning API is working'
    });
});

export default router; 