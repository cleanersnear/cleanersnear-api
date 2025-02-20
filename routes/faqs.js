import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => { 
    try {
        // Get query parameters for filtering
        const { category, search } = req.query;

        // Start building the query
        let query = supabase
            .from('faqs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        // Apply category filter if provided
        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        // Execute the query
        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Apply search filter in memory if search term provided
        let filteredData = data;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = data.filter(faq => 
                faq.question.toLowerCase().includes(searchLower) ||
                faq.answer.toLowerCase().includes(searchLower)
            );
        }

        res.json(filteredData);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch FAQs',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
});

export default router; 