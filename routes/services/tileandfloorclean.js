import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

const floorCleanHandler = {
    processEnquiry: async (req, res) => {
        try {
            const { formData } = req.body;
            
            console.log('Processing tile and floor cleaning enquiry...');

            // Generate enquiry number
            const enquiryNumber = `FLR-${Date.now().toString().slice(-8)}`;
            
            // Insert into database with flat structure
            const { data: enquiryData, error: enquiryError } = await supabase
                .from('floor_cleaning_enquiries')
                .insert({
                    enquiry_number: enquiryNumber,
                    
                    // Contact Information
                    name: formData.name || '',
                    email: formData.email || '',
                    phone: formData.phone || '',
                    preferred_contact: formData.preferredContact || '',
                    preferred_time: formData.preferredTime || '',
                    
                    // Property Details
                    property_type: formData.propertyType || '',
                    street_address: formData.address?.street || '',
                    unit_number: formData.address?.unit || '',
                    suburb: formData.address?.suburb || '',
                    state: formData.address?.state || '',
                    postcode: formData.address?.postcode || '',
                    
                    // Floor Specific Details
                    floor_type: formData.floorType || '',
                    approximate_area: formData.approximateArea || '',
                    expected_date: formData.expectedDate || '',
                    additional_notes: formData.additionalNotes || '',
                    
                    // Status
                    status: 'pending'
                })
                .select()
                .single();

            if (enquiryError) throw enquiryError;

            // Send success response
            res.status(201).json({
                success: true,
                message: 'Tile and floor cleaning enquiry submitted successfully',
                data: {
                    enquiryNumber: enquiryNumber,
                    status: 'pending',
                    expectedContact: '24 hours',
                    createdAt: enquiryData.created_at
                }
            });

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

// Routes
router.post('/submit-enquiry', floorCleanHandler.processEnquiry);

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Tile and floor cleaning API is working'
    });
});

export default router; 