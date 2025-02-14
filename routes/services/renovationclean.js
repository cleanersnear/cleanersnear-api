import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

// Handler functions
const renovationCleanHandler = {
    processEnquiry: async (req, res) => {
        try {
            const { formData } = req.body;
            
            console.log('Processing renovation cleaning enquiry...');

            // Generate enquiry number
            const enquiryNumber = `REN-${Date.now().toString().slice(-8)}`;
            
            // Insert into database with flat structure
            const { data: enquiryData, error: enquiryError } = await supabase
                .from('renovation_cleaning_enquiries')
                .insert({
                    enquiry_number: enquiryNumber,
                    
                    // Contact Information
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    preferred_contact: formData.preferredContact,
                    preferred_time: formData.preferredTime,
                    
                    // Property Details
                    property_type: formData.propertyType,
                    street_address: formData.address.street,
                    unit_number: formData.address.unit,
                    suburb: formData.address.suburb,
                    state: formData.address.state,
                    postcode: formData.address.postcode,
                    
                    // Renovation Details
                    renovation_type: formData.renovationType,
                    expected_date: formData.expectedDate,
                    additional_notes: formData.additionalNotes,
                    
                    // Status
                    status: 'pending'
                })
                .select()
                .single();

            if (enquiryError) throw enquiryError;

            // Send success response
            res.status(201).json({
                success: true,
                message: 'Renovation cleaning enquiry submitted successfully',
                data: {
                    enquiryNumber: enquiryNumber,
                    status: 'pending',
                    expectedContact: '24 hours',
                    createdAt: enquiryData.created_at
                }
            });

        } catch (error) {
            console.error('Renovation cleaning enquiry error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit renovation cleaning enquiry',
                error: error.message
            });
        }
    }
};

// POST route for enquiry submission
router.post('/submit-enquiry', renovationCleanHandler.processEnquiry);

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Renovation cleaning API is working'
    });
});

export default router; 