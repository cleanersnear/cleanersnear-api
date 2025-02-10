import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler.js';
import quickEnquiryRoutes from './routes/quickenquiry.js';
import costCalculatorRoutes from './routes/costcalculator.js';
import subscriptionRoutes from './routes/subscription.js';
import contactRoutes from './routes/contact.js';
import quotesRoutes from './routes/quotes.js';
import careersRoutes from './routes/careers.js';
import faqsRoutes from './routes/faqs.js';
import blogsRoutes from './routes/blogs.js';
import bookingsRouter from './routes/bookings.js';
import deepCleaningRouter from './routes/services/deep-cleaning.js';
import detailsRouter from './routes/details.js';
import carpetCleaningRouter from './routes/services/carpet-cleaning.js';
import generalCleaningRouter from './routes/services/general-cleaning.js';
import endOfLeaseRouter from './routes/services/end-of-lease.js';
import moveInOutRouter from './routes/services/move-in-out.js';
import ndisCleanRouter from './routes/services/ndis-clean.js';
import commercialCleanRouter from './routes/services/commercial-clean.js';
import upholsteryCleanRouter from './routes/services/upholstery-clean.js';
import renovationCleanRouter from './routes/services/renovation-clean.js';
import ovenCleanRouter from './routes/services/oven-clean.js';
import tileAndFloorCleanRouter from './routes/services/tile-and-floor-clean.js';
import windowCleanRouter from './routes/services/window-clean.js';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'https://cleanersnear.com.au'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
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
app.use('/api/services/deep-cleaning', deepCleaningRouter);
app.use('/api/details', detailsRouter);
app.use('/api/services/carpet-cleaning', carpetCleaningRouter);
app.use('/api/services/general-cleaning', generalCleaningRouter);
app.use('/api/services/end-of-lease', endOfLeaseRouter);
app.use('/api/services/move-in-out', moveInOutRouter);
app.use('/api/services/ndis-clean', ndisCleanRouter);
app.use('/api/services/commercial-clean', commercialCleanRouter);
app.use('/api/services/upholstery-clean', upholsteryCleanRouter);
app.use('/api/services/renovation-clean', renovationCleanRouter);
app.use('/api/services/oven-clean', ovenCleanRouter);
app.use('/api/services/tile-and-floor-clean', tileAndFloorCleanRouter);
app.use('/api/services/window-clean', windowCleanRouter);

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