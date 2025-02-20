import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Define defaults at route level
const DEFAULT_IMAGES = {
    BLOG_COVER: '/images/blogimages/latest/bedroom-clean.jpg',
    AUTHOR_AVATAR: '/images/blogimages/authors/author-1.jpg'
};

// Add default content
const DEFAULT_CONTENT = {
    EXCERPT: 'No excerpt available',
    META_DESC: 'No description available',
    CATEGORY: 'Uncategorized',
    READ_TIME: '5 min read',
    AUTHOR_NAME: 'Anonymous',
    AUTHOR_ROLE: 'Guest Writer',
    INTRODUCTION: 'No introduction available',
    CONTENT: { sections: [] }
};

// Get all blogs
router.get('/', async (req, res) => {
    try {
        const { category, search, featured } = req.query;

        let query = supabase
            .from('blogs')
            .select(`
                id,
                slug,
                title,
                excerpt,
                meta_description,
                category,
                read_time,
                estimated_read_time,
                views,
                tags,
                likes,
                status,
                is_featured,
                author_name,
                author_role,
                author_image,
                cover_image,
                created_at
            `)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        if (featured === 'true') {
            query = query.eq('is_featured', true).limit(1);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Apply defaults and transform data before sending
        const transformedData = data.map(blog => ({
            ...blog,
            cover_image: blog.cover_image || DEFAULT_IMAGES.BLOG_COVER,
            author_image: blog.author_image || DEFAULT_IMAGES.AUTHOR_AVATAR
        }));

        // Apply search filter if provided
        let filteredData = transformedData;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = transformedData.filter(blog => 
                blog.title.toLowerCase().includes(searchLower) ||
                blog.excerpt.toLowerCase().includes(searchLower) ||
                blog.meta_description.toLowerCase().includes(searchLower)
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

// Add this new route for search FIRST
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.json([]);
        }

        const { data, error } = await supabase
            .from('blogs')
            .select(`
                id,
                slug,
                title,
                excerpt,
                meta_description
            `)
            .eq('status', 'published')
            .ilike('title', `%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Add console.log to debug
        console.log('Search results:', data);
        res.json(data || []);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search blogs'
        });
    }
});

// Dedicated route for single blog post
router.get('/post/:slug', async (req, res) => {
    try {
        // Get blog
        const { data: blog, error: blogError } = await supabase
            .from('blogs')
            .select('*')
            .eq('slug', req.params.slug)
            .single();

        if (blogError) throw blogError;

        // Get sections
        const { data: sections, error: sectionsError } = await supabase
            .from('blog_sections')
            .select('*')
            .eq('blog_id', blog.id)
            .order('order_index');

        if (sectionsError) throw sectionsError;

        // Get FAQs
        const { data: faqs, error: faqsError } = await supabase
            .from('blog_faqs')
            .select('*')
            .eq('blog_id', blog.id)
            .order('order_index');

        if (faqsError) throw faqsError;

        res.json({
            blog,
            sections,
            faqs
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blog post'
        });
    }
});

export default router; 