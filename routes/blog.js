const express = require('express');
const { supabaseOld } = require('../config/oldSupabase');

const router = express.Router();

// Get all slugs for static generation
router.get('/slugs', async (req, res) => {
    try {
        const { data, error } = await supabaseOld
            .from('blog')
            .select('slug')
            .order('publish_date', { ascending: false });

        if (error) throw error;
        res.json({ slugs: data.map(item => item.slug) });
    } catch (error) {
        console.error('Error fetching slugs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch slugs',
            error: error.message
        });
    }
});

// Get hero blog for static generation
router.get('/hero', async (req, res) => {
    try {
        const { data, error } = await supabaseOld
            .from('blog')
            .select(`
                slug,
                title,
                excerpt,
                category,
                read_time,
                cover_image,
                author_name,
                author_role,
                author_image,
                last_updated
            `)
            .eq('is_featured', true)
            .order('last_updated', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;

        res.json({
            slug: data.slug,
            title: data.title,
            excerpt: data.excerpt,
            category: data.category,
            readTime: data.read_time,
            coverImage: data.cover_image,
            author: {
                name: data.author_name,
                role: data.author_role,
                image: data.author_image
            }
        });
    } catch (error) {
        console.error('Error fetching hero blog:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hero blog',
            error: error.message
        });
    }
});

// Get latest blogs with pagination
router.get('/latest', async (req, res) => {
    try {
        // Get all blogs without pagination
        const { data, error } = await supabaseOld
            .from('blog')
            .select(`
                slug,
                title,
                excerpt,
                read_time,
                last_updated,
                cover_image,
                author_name,
                author_image
            `)
            .order('last_updated', { ascending: false }); // No limit, get all blogs

        if (error) throw error;

        // Transform data
        const transformedData = data.map(blog => ({
            slug: blog.slug,
            title: blog.title,
            excerpt: blog.excerpt,
            readTime: blog.read_time,
            lastUpdated: blog.last_updated,
            coverImage: blog.cover_image,
            author: {
                name: blog.author_name,
                image: blog.author_image
            }
        }));

        res.json({
            blogs: transformedData,
            pagination: {
                totalBlogs: data.length,
                postsPerPage: 3,  // Keep this for client-side pagination
                totalPages: Math.ceil(data.length / 3)
            }
        });

    } catch (error) {
        console.error('Error fetching latest blogs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch latest blogs',
            error: error.message
        });
    }
});

// Get top blogs
router.get('/top', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const excludeSlug = req.query.excludeSlug;

        let query = supabaseOld
            .from('blog')
            .select(`
                slug,
                title,
                excerpt,
                category,
                read_time,
                last_updated,
                cover_image,
                likes,
                author_name,
                author_role,
                author_image
            `)
            .order('likes', { ascending: false })
            .limit(limit);

        if (excludeSlug) {
            query = query.neq('slug', excludeSlug);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            blogs: data.map(blog => ({
                slug: blog.slug,
                title: blog.title,
                excerpt: blog.excerpt,
                category: blog.category,
                readTime: blog.read_time,
                lastUpdated: blog.last_updated,
                coverImage: blog.cover_image,
                likes: blog.likes,
                author: {
                    name: blog.author_name,
                    role: blog.author_role,
                    image: blog.author_image
                }
            }))
        });
    } catch (error) {
        console.error('Error fetching top blogs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top blogs',
            error: error.message
        });
    }
});

// Search blogs
router.get('/search/data', async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.json({ blogs: [] });
        }

        const { data, error } = await supabaseOld
            .from('blog')
            .select(`
                slug,
                title,
                excerpt,
                category,
                read_time,
                cover_image,
                author_name,
                author_image
            `)
            .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,category.ilike.%${query}%`)
            .order('last_updated', { ascending: false })
            .limit(5);

        if (error) throw error;

        res.json({
            blogs: data.map(blog => ({
                slug: blog.slug,
                title: blog.title,
                excerpt: blog.excerpt,
                category: blog.category,
                readTime: blog.read_time,
                coverImage: blog.cover_image,
                author: {
                    name: blog.author_name,
                    image: blog.author_image
                }
            }))
        });
    } catch (error) {
        console.error('Error searching blogs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search blogs',
            error: error.message
        });
    }
});

// Get single blog post
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data: blog, error: blogError } = await supabaseOld
            .from('blog')
            .select(`
                *,
                blog_metadata (
                    table_of_contents,
                    faqs
                ),
                blog_content (
                    introduction,
                    sections
                )
            `)
            .eq('slug', slug)
            .single();

        if (blogError) {
            if (blogError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            }
            throw blogError;
        }

        res.json({
            slug: blog.slug,
            title: blog.title,
            excerpt: blog.excerpt,
            category: blog.category,
            readTime: blog.read_time,
            publishDate: blog.publish_date,
            lastUpdated: blog.last_updated,
            coverImage: blog.cover_image,
            likes: blog.likes,
            author: {
                name: blog.author_name,
                role: blog.author_role,
                image: blog.author_image
            },
            introduction: blog.blog_content.introduction,
            sections: blog.blog_content.sections,
            tableOfContents: blog.blog_metadata.table_of_contents,
            faqs: blog.blog_metadata.faqs
        });
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blog post',
            error: error.message
        });
    }
});

module.exports = router; 