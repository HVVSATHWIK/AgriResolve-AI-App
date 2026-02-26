import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

// Mock Data for Mandi Prices (fallback/demo data)
const MOCK_MANDI_PRICES = [
    { id: '1', commodity: 'Wheat', state: 'Punjab', market: 'Khanna', min_price: 2100, max_price: 2350, modal_price: 2250, date: new Date().toISOString() },
    { id: '2', commodity: 'Rice (Paddy)', state: 'Andhra Pradesh', market: 'Guntur', min_price: 1900, max_price: 2100, modal_price: 2050, date: new Date().toISOString() },
    { id: '3', commodity: 'Tomato', state: 'Maharashtra', market: 'Nashik', min_price: 800, max_price: 1500, modal_price: 1200, date: new Date().toISOString() },
    { id: '4', commodity: 'Cotton', state: 'Gujarat', market: 'Rajkot', min_price: 5500, max_price: 6200, modal_price: 5800, date: new Date().toISOString() },
    { id: '5', commodity: 'Onion', state: 'Maharashtra', market: 'Lasalgaon', min_price: 1200, max_price: 1800, modal_price: 1500, date: new Date().toISOString() },
    { id: '6', commodity: 'Maize', state: 'Karnataka', market: 'Davangere', min_price: 1800, max_price: 2000, modal_price: 1900, date: new Date().toISOString() },
];

/**
 * GET /api/market/prices
 * Fetch current market prices for commodities.
 * Currently returns mock data simulating eNAM response.
 */
router.get('/market/prices', async (req, res) => {
    try {
        // In a real implementation, we would fetch from Redis cache or eNAM API here.
        // For now, we return the mock dataset.

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        res.json({
            success: true,
            data: MOCK_MANDI_PRICES,
            source: 'simulated_enam'
        });
    } catch (error) {
        logger.error('Error fetching market prices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market prices'
        });
    }
});

export const marketRouter = router;
