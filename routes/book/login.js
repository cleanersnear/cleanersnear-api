import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to check authentication
const checkAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    // Fetch customer data
    const { data: customerData, error: customerError } = await supabase
      .from('quick_customers')
      .select('*')
      .eq('email', email)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      throw customerError;
    }

    // Return both auth and customer data
    res.json({
      token: authData.session.access_token,
      customer: customerData || null,
      message: customerData ? 'Login successful' : 'Login successful, but customer profile not found'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Register route
router.post('/register', async (req, res) => {
  const { 
    email, 
    password, 
    first_name, 
    last_name = null,
    phone = null,
    street = null,
    suburb = null,
    state = null,
    postcode = null,
    additional_info = null
  } = req.body;

  try {
    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Prepare customer data
    const customerData = {
      email,
      first_name,
      last_name,
      phone,
      street,
      suburb,
      state,
      postcode,
      additional_info
    };

    // Remove null/empty values to avoid inserting unnecessary nulls
    Object.keys(customerData).forEach(key => {
      if (customerData[key] === null || customerData[key] === '') {
        delete customerData[key];
      }
    });

    // Create customer profile
    const { data: insertedCustomer, error: customerError } = await supabase
      .from('quick_customers')
      .insert([customerData])
      .select()
      .single();

    if (customerError) throw customerError;

    res.json({
      token: authData.session?.access_token,
      customer: insertedCustomer,
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get customer profile
router.get('/profile', checkAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quick_customers')
      .select('*')
      .eq('email', req.user.email)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update customer profile
router.put('/profile', checkAuth, async (req, res) => {
  const updates = req.body;
  delete updates.email; // Prevent email updates
  delete updates.id; // Prevent id updates
  
  try {
    const { data, error } = await supabase
      .from('quick_customers')
      .update(updates)
      .eq('email', req.user.email)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if email exists in our customer database
    const { data: customerData, error: customerError } = await supabase
      .from('quick_customers')
      .select('email')
      .eq('email', email)
      .single();

    // Always return success message for security (don't reveal if email exists)
    // But only send reset email if email exists in our system
    if (customerData && !customerError) {
      // Send password reset email using Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/book/user/reset-password`,
      });

      if (resetError) {
        console.error('Password reset error:', resetError);
        // Still return success to user for security
      }
    }

    // Always return success message regardless of whether email exists
    res.json({ 
      message: 'If you entered a registered email address, you will soon receive an email allowing you to change your password.',
      success: true 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({ error: 'An error occurred. Please try again later.' });
  }
});

// Logout route
router.post('/logout', checkAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
