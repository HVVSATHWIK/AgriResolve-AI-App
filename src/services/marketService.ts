
import { config } from '../config';

const API_BASE_URL = config.apiUrl;

export interface MarketPrice {
    id: string;
    commodity: string;
    state: string;
    market: string;
    min_price: number;
    max_price: number;
    modal_price: number;
    date: string;
}

export interface MarketResponse {
    success: boolean;
    data: MarketPrice[];
    source: string;
}

export async function fetchMarketPrices(): Promise<MarketPrice[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/market/prices`);
        if (!response.ok) {
            throw new Error(`Failed to fetch market prices: ${response.statusText}`);
        }
        const result: MarketResponse = await response.json();
        if (result.success) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching market prices:', error);
        return [];
    }
}
