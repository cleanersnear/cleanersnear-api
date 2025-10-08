const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create server function for Vercel
const createServer = () => {
  return app;
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://www.cleaningprofessionals.com.au',
  'https://cleaningprofessionals.com.au',
  // Frontend Vercel deployment
  'https://clean-main-phi.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ROUTES
// ============================================================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Cleaner Home API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      bookings: '/api/bookings',
      testDb: '/api/test-db'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (optional - for monitoring)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Clean Home API is running',
    timestamp: new Date().toISOString()
  });
});

// Import and use routes
const bookingRoutes = require('./routes/bookings');
const faqsRoutes = require('./routes/faqs');
const blogsRoutesOld = require('./routes/blogs');
const blogRoutesOld = require('./routes/blog');
const careersRoutesOld = require('./routes/careers');
const contactRoutes = require('./routes/contact');
const subscriptionRoutes = require('./routes/subscription');
const quickBookBookingRoutes = require('./routes/quick-book/booking');
const quickBookAuthRoutes = require('./routes/quick-book/login');
const testDbRoutes = require('./routes/test-db');

app.use('/api/bookings', bookingRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api/blogs', blogsRoutesOld);
app.use('/api/blog', blogRoutesOld);
app.use('/api/careers', careersRoutesOld);
app.use('/api/contact', contactRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/quick-book/bookings', quickBookBookingRoutes);
app.use('/api/quick-book/auth', quickBookAuthRoutes);
app.use('/api/test-db', testDbRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================================================
// START SERVER (Only for local development)
// ============================================================================

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 Clean Home API server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`📝 Bookings API: http://localhost:${PORT}/api/bookings`);
    console.log(`🧪 Test DB API: http://localhost:${PORT}/api/test-db`);
    
    // Test database connection on startup
    console.log('\n🔍 Testing database connection...');
    await testConnection();
  });
}

// Export for Vercel
module.exports = app;
module.exports.createServer = createServer;
