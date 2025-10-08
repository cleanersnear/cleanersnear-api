const express = require('express');
// Use legacy/old Supabase project for FAQs per request
const { supabaseOld } = require('../config/oldSupabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabaseOld
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data || [];
    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter((faq) =>
        String(faq.question || '').toLowerCase().includes(s) ||
        String(faq.answer || '').toLowerCase().includes(s)
      );
    }

    res.json(filtered);
  } catch (error) {
    console.error('FAQs route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch FAQs'
    });
  }
});

module.exports = router;