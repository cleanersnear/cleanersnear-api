import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Service type mapping
const SERVICE_ROUTES = {
    'deep-clean': 'deep-cleaning',
    'carpet-clean': 'carpet-cleaning',
    'general-clean': 'general-cleaning',
    'end-of-lease': 'end-of-lease',
    'commercial-clean': 'commercial-clean',
    'renovation-clean': 'renovation-clean',
    'move-in-out': 'move-in-out',
    'ndis-clean': 'ndis-clean',
    'upholstery-clean': 'upholstery-clean'
};

// POST /api/bookings/submit
router.post('/submit', async (req, res) => {
    try {
        const { customer, booking, serviceDetails } = req.body;
        
        console.log('Received service type:', serviceDetails.type);
        console.log('Available service routes:', SERVICE_ROUTES);

        // Get the correct route path
        const servicePath = SERVICE_ROUTES[serviceDetails.type];
        if (!servicePath) {
            throw new Error(`Unsupported service type: ${serviceDetails.type}`);
        }

        // Forward to the appropriate service handler
        const serviceRouter = await import(`./services/${servicePath}.js`);
        await serviceRouter.default.processBooking(req, res);

    } catch (error) {
        console.error('Booking submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit booking',
            error: error.message
        });
    }
});

export default router; 