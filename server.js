import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import quickEnquiryRoutes from './routes/quickenquiry.js';
import costCalculatorRoutes from './routes/costcalculator.js';
import subscriptionRoutes from './routes/subscription.js';
import contactRoutes from './routes/contact.js';
import quotesRoutes from './routes/quotes.js';
import careersRoutes from './routes/careers.js';
import faqsRoutes from './routes/faqs.js';
import blogsRoutes from './routes/blogs.js';
import bookingsRouter from './routes/bookings.js';
import deepCleaningRouter from './routes/services/deepcleaning.js';
import detailsRouter from './routes/details.js';
import carpetCleaningRouter from './routes/services/carpetcleaning.js';
import generalCleaningRouter from './routes/services/generalcleaning.js';
import endOfLeaseRouter from './routes/services/endoflease.js';
import moveInOutRouter from './routes/services/moveinout.js';
import ndisCleanRouter from './routes/services/ndisclean.js';
import commercialCleanRouter from './routes/services/commercialclean.js';
import upholsteryCleanRouter from './routes/services/upholsteryclean.js';
import renovationCleanRouter from './routes/services/renovationclean.js';
import ovenCleanRouter from './routes/services/ovenclean.js';
import tileAndFloorCleanRouter from './routes/services/tileandfloorclean.js';
import windowCleanRouter from './routes/services/windowclean.js';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'https://cleanersnear.com.au',
        'https://www.cleanersnear.com.au',
        'https://api.cleanersnear.com.au'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Add this before your other routes
app.get('/', (req, res) => {
    res.json({
        message: 'CleanersNear API Server',
        status: 'running',
        version: '1.0.0'
    });
});

// Routes
app.use('/api/quickenquiry', quickEnquiryRoutes);
app.use('/api/costcalculator', costCalculatorRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/bookings', bookingsRouter);
app.use('/api/services/deepcleaning', deepCleaningRouter);
app.use('/api/details', detailsRouter);
app.use('/api/services/carpetcleaning', carpetCleaningRouter);
app.use('/api/services/generalcleaning', generalCleaningRouter);
app.use('/api/services/endoflease', endOfLeaseRouter);
app.use('/api/services/moveinout', moveInOutRouter);
app.use('/api/services/ndisclean', ndisCleanRouter);
app.use('/api/services/commercialclean', commercialCleanRouter);
app.use('/api/services/upholsteryclean', upholsteryCleanRouter);
app.use('/api/services/renovationclean', renovationCleanRouter);
app.use('/api/services/ovenclean', ovenCleanRouter);
app.use('/api/services/tileandfloorclean', tileAndFloorCleanRouter);
app.use('/api/services/windowclean', windowCleanRouter);

// Add this for debugging
console.log('Available routes:', app._router.stack
    .filter(r => r.route)
    .map(r => ({
        path: r.route.path,
        methods: Object.keys(r.route.methods)
    }))
);

// Error handling
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Add 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Test the API at: http://localhost:${port}/api/test`);
}); 