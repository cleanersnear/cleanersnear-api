const express = require('express');
const { supabaseOld } = require('../config/oldSupabase');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Get query parameters for filtering
        const { department, type, search } = req.query;

        // Start building the query
        let query = supabaseOld
            .from('careers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        // Apply filters if provided
        if (department && department !== 'All') {
            query = query.eq('department', department);
        }
        if (type && type !== 'All Types') {
            query = query.eq('type', type);
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
            filteredData = data.filter(job => 
                job.title.toLowerCase().includes(searchLower) ||
                job.description.toLowerCase().includes(searchLower) ||
                job.requirements.some(req => req.toLowerCase().includes(searchLower)) ||
                job.responsibilities.some(resp => resp.toLowerCase().includes(searchLower))
            );
        }

        res.json(filteredData);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch careers',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
});

module.exports = router; 