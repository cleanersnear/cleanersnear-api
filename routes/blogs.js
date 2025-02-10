import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get all blogs
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;

        let query = supabase
            .from('blogs')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Apply search filter in memory if search term provided
        let filteredData = data;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = data.filter(blog => 
                blog.title.toLowerCase().includes(searchLower) ||
                blog.excerpt.toLowerCase().includes(searchLower)
            );
        }

        res.json(filteredData);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch blogs',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
});

// Get single blog by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('is_published', true)
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch blog',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
});

export default router; 