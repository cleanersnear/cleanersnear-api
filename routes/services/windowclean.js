import express from 'express';
import { supabase } from '../../config/supabase.js';

const router = express.Router();

const windowCleanHandler = {
    processEnquiry: async (req, res) => {
        try {
            const { formData } = req.body;
            
            console.log('Processing window cleaning enquiry...');

            // Generate enquiry number
            const enquiryNumber = `WIN-${Date.now().toString().slice(-8)}`;
            
            // Insert into database with flat structure
            const { data: enquiryData, error: enquiryError } = await supabase
                .from('window_cleaning_enquiries')
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
                    
                    // Window Specific Details
                    cleaning_type: formData.windowDetails?.cleaningType || '',
                    num_windows: formData.windowDetails?.numWindows || '',
                    num_sliding_doors: formData.windowDetails?.numSlidingDoors || '',
                    max_floor_level: formData.windowDetails?.maxFloorLevel || '',
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
                message: 'Window cleaning enquiry submitted successfully',
                data: {
                    enquiryNumber: enquiryNumber,
                    status: 'pending',
                    expectedContact: '24 hours',
                    createdAt: enquiryData.created_at
                }
            });

        } catch (error) {
            console.error('Window cleaning enquiry error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit window cleaning enquiry',
                error: error.message
            });
        }
    }
};

// Routes
router.post('/submit-enquiry', windowCleanHandler.processEnquiry);

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Window cleaning API is working'
    });
});

export default router; 