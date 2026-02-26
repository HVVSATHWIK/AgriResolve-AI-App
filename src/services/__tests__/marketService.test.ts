import { fetchMarketPrices, MarketPrice } from '../marketService';

jest.mock('../../config', () => ({
    config: { apiUrl: '/api' }
}));

// Mock global fetch
global.fetch = jest.fn();

describe('marketService', () => {
    beforeEach(() => {
        // Clear mock calls
        (global.fetch as jest.Mock).mockClear();
    });

    it('should return a list of prices when API call is successful', async () => {
        const mockData: MarketPrice[] = [
            { id: '1', commodity: 'Wheat', state: 'Punjab', market: 'Khanna', min_price: 2100, max_price: 2350, modal_price: 2250, date: '2023-10-27' },
        ];

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: mockData,
                source: 'test'
            })
        });

        const prices = await fetchMarketPrices();
        expect(prices).toHaveLength(1);
        expect(prices[0].commodity).toBe('Wheat');
        expect(prices[0].modal_price).toBe(2250);
    });

    it('should return empty list when API fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            statusText: 'Internal Server Error'
        });

        const prices = await fetchMarketPrices();
        expect(prices).toHaveLength(0);
    });

    it('should return empty list when API returns success: false', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                success: false,
                message: 'Error'
            })
        });

        const prices = await fetchMarketPrices();
        expect(prices).toHaveLength(0);
    });

    it('should handle network exceptions gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

        const prices = await fetchMarketPrices();
        expect(prices).toHaveLength(0);
    });
});
