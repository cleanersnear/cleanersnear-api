const express = require('express');
const { supabase } = require('../config/database');
const router = express.Router();

// Test database connection endpoint
router.post('/', async (req, res) => {
  try {
    console.log('🔄 Backend: POST /api/test-db started');
    const { name, email } = req.body;
    console.log('📦 Backend: Received data:', { name, email });

    // Validate input
    if (!name || !email) {
      console.error('❌ Backend: Validation failed - missing name or email');
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    console.log('💾 Backend: Attempting to save to Supabase...');
    // Insert data into Supabase
    const { data, error } = await supabase
      .from('test_records')
      .insert([{ 
        name: name.trim(), 
        email: email.trim() 
      }])
      .select();

    if (error) {
      console.error('❌ Backend: Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save data to database: ' + error.message
      });
    }

    const newRecord = data[0];
    console.log('✅ Backend: Test data saved to Supabase:', newRecord);

    res.json({
      success: true,
      id: newRecord.id,
      message: 'Data saved successfully',
      data: newRecord
    });

  } catch (error) {
    console.error('❌ Backend: Test DB Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save data to database: ' + error.message
    });
  }
});

// Get all test records endpoint
router.get('/', async (req, res) => {
  try {
    console.log('🔄 Backend: GET /api/test-db started');
    console.log('💾 Backend: Attempting to fetch from Supabase...');
    
    const { data, error } = await supabase
      .from('test_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Backend: Supabase select error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve test data: ' + error.message
      });
    }

    console.log('✅ Backend: Successfully fetched records:', data.length, 'records');
    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('❌ Backend: Get test data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test data: ' + error.message
    });
  }
});

module.exports = router;
