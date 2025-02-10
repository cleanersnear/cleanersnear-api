import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const floorCleanHandler = {
    processEnquiry: async (req, res) => {
        try {
            const { formData } = req.body;
            
            console.log('Processing tile and floor cleaning enquiry...');

            // 1. Create enquiry record
            const enquiryNumber = `FLR-${Date.now().toString().slice(-8)}`;
            
            const { data: enquiryData, error: enquiryError } = await supabase
                .from('floor_cleaning_enquiries')
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
                    floor_details: {
                        type: formData.floorType,
                        approximate_area: formData.approximateArea,
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
                message: 'Tile and floor cleaning enquiry submitted successfully',
                data: {
                    enquiryNumber: enquiryNumber,
                    status: 'pending',
                    expectedContact: '24 hours',
                    createdAt: enquiryData.created_at
                }
            };
            
            res.json(response);

        } catch (error) {
            console.error('Tile and floor cleaning enquiry error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit tile and floor cleaning enquiry',
                error: error.message
            });
        }
    }
};

// POST route for enquiry submission
router.post('/submit-enquiry', floorCleanHandler.processEnquiry);

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Tile and floor cleaning API is working'
    });
});

export default router; 