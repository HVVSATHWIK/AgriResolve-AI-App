import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { fetchCurrentWeather, fetchHourlyWeather } from '../services/weatherService.js';

const router = Router();

type IrrigationLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface DataGovRecord {
    commodity?: string;
    state?: string;
    district?: string;
    market?: string;
    min_price?: string;
    max_price?: string;
    modal_price?: string;
    arrival_date?: string;
}

interface MarketPriceItem {
    id: string;
    commodity: string;
    state: string;
    market: string;
    min_price: number;
    max_price: number;
    modal_price: number;
    date: string;
}

interface CropProfile {
    key: string;
    name: string;
    soilTypes: string[];
    rainfallRange: [number, number];
    tempRange: [number, number];
    irrigationNeed: IrrigationLevel;
    avgYieldPerAcre: number;
    avgCostPerAcre: number;
    climateResilient: boolean;
    commodityAliases: string[];
}

const CROP_PROFILES: CropProfile[] = [
    {
        key: 'rice',
        name: 'Rice',
        soilTypes: ['loamy', 'clayey', 'alluvial'],
        rainfallRange: [900, 2500],
        tempRange: [20, 35],
        irrigationNeed: 'HIGH',
        avgYieldPerAcre: 22,
        avgCostPerAcre: 21000,
        climateResilient: false,
        commodityAliases: ['rice', 'paddy']
    },
    {
        key: 'wheat',
        name: 'Wheat',
        soilTypes: ['loamy', 'alluvial', 'black'],
        rainfallRange: [450, 950],
        tempRange: [12, 28],
        irrigationNeed: 'MEDIUM',
        avgYieldPerAcre: 18,
        avgCostPerAcre: 17000,
        climateResilient: true,
        commodityAliases: ['wheat']
    },
    {
        key: 'maize',
        name: 'Maize',
        soilTypes: ['loamy', 'sandy', 'red', 'black'],
        rainfallRange: [500, 1200],
        tempRange: [18, 32],
        irrigationNeed: 'MEDIUM',
        avgYieldPerAcre: 20,
        avgCostPerAcre: 16000,
        climateResilient: true,
        commodityAliases: ['maize']
    },
    {
        key: 'cotton',
        name: 'Cotton',
        soilTypes: ['black', 'loamy'],
        rainfallRange: [600, 1200],
        tempRange: [21, 35],
        irrigationNeed: 'MEDIUM',
        avgYieldPerAcre: 7,
        avgCostPerAcre: 24000,
        climateResilient: false,
        commodityAliases: ['cotton', 'kapas']
    },
    {
        key: 'chilli',
        name: 'Red Chilli',
        soilTypes: ['loamy', 'sandy', 'red'],
        rainfallRange: [500, 1000],
        tempRange: [20, 34],
        irrigationNeed: 'MEDIUM',
        avgYieldPerAcre: 8,
        avgCostPerAcre: 26000,
        climateResilient: false,
        commodityAliases: ['red chilli', 'chilli']
    },
    {
        key: 'soybean',
        name: 'Soybean',
        soilTypes: ['black', 'loamy', 'alluvial'],
        rainfallRange: [600, 1100],
        tempRange: [20, 30],
        irrigationNeed: 'LOW',
        avgYieldPerAcre: 12,
        avgCostPerAcre: 14000,
        climateResilient: true,
        commodityAliases: ['soybean']
    },
    {
        key: 'tur',
        name: 'Tur (Pigeon Pea)',
        soilTypes: ['black', 'red', 'loamy'],
        rainfallRange: [500, 1000],
        tempRange: [18, 35],
        irrigationNeed: 'LOW',
        avgYieldPerAcre: 7,
        avgCostPerAcre: 12000,
        climateResilient: true,
        commodityAliases: ['tur', 'arhar', 'pigeon pea']
    },
];

// data.gov.in public sample API key (from official documentation examples)
const DATA_GOV_SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const DATA_GOV_RESOURCE_ID = process.env.DATA_GOV_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';

// Mock Data for Mandi Prices (fallback)
const MOCK_MANDI_PRICES = [
    { id: '1', commodity: 'Wheat', state: 'Punjab', market: 'Khanna', min_price: 2100, max_price: 2350, modal_price: 2250, date: new Date().toISOString() },
    { id: '2', commodity: 'Rice (Paddy)', state: 'Andhra Pradesh', market: 'Guntur', min_price: 1900, max_price: 2100, modal_price: 2050, date: new Date().toISOString() },
    { id: '3', commodity: 'Tomato', state: 'Maharashtra', market: 'Nashik', min_price: 800, max_price: 1500, modal_price: 1200, date: new Date().toISOString() },
    { id: '4', commodity: 'Cotton', state: 'Gujarat', market: 'Rajkot', min_price: 5500, max_price: 6200, modal_price: 5800, date: new Date().toISOString() },
    { id: '5', commodity: 'Onion', state: 'Maharashtra', market: 'Lasalgaon', min_price: 1200, max_price: 1800, modal_price: 1500, date: new Date().toISOString() },
    { id: '6', commodity: 'Maize', state: 'Karnataka', market: 'Davangere', min_price: 1800, max_price: 2000, modal_price: 1900, date: new Date().toISOString() },
];

const normalizePrice = (value: unknown): number => {
    const num = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(/,/g, ''));
    return Number.isFinite(num) ? num : 0;
};

const normalizeRecords = (records: DataGovRecord[]): MarketPriceItem[] => {
    return records
        .map((item, index) => ({
            id: `${item.commodity || 'crop'}-${index}`,
            commodity: item.commodity || 'Unknown',
            state: item.state || 'Unknown',
            market: item.market || item.district || 'Unknown',
            min_price: normalizePrice(item.min_price),
            max_price: normalizePrice(item.max_price),
            modal_price: normalizePrice(item.modal_price),
            date: item.arrival_date || new Date().toISOString(),
        }))
        .filter((item) => item.modal_price > 0);
};

async function fetchDataGovMarketPrices(params?: { commodity?: string; state?: string; district?: string; limit?: number }): Promise<MarketPriceItem[]> {
    // Prefer env var, fall back to public sample key so app works out of the box
    const apiKey = (process.env.DATA_GOV_API_KEY || DATA_GOV_SAMPLE_KEY).trim();
    if (!apiKey) {
        logger.warn('DATA_GOV_API_KEY not configured, using mock market data');
        return MOCK_MANDI_PRICES;
    }

    const url = new URL(`https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}`);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(params?.limit ?? 60));

    if (params?.commodity) url.searchParams.set('filters[commodity]', params.commodity);
    if (params?.state) url.searchParams.set('filters[state]', params.state);
    if (params?.district) url.searchParams.set('filters[district]', params.district);

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { accept: 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`data.gov request failed: ${response.status}`);
        }

        const payload = await response.json() as { records?: DataGovRecord[] };
        const normalized = normalizeRecords(payload.records ?? []);

        if (!normalized.length) {
            logger.warn('No market records from data.gov, falling back to mock data');
            return MOCK_MANDI_PRICES;
        }

        return normalized;
    } catch (error) {
        logger.error('Error fetching data.gov market prices:', error);
        return MOCK_MANDI_PRICES;
    }
}

const irrigationLevelFromInput = (value: string | undefined): IrrigationLevel => {
    const normalized = (value || 'medium').toLowerCase();
    if (normalized.includes('low')) return 'LOW';
    if (normalized.includes('high')) return 'HIGH';
    return 'MEDIUM';
};

const toNumber = (value: unknown, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const scoreRangeMatch = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return 1;
    const tolerance = Math.max((max - min) * 0.2, 1);
    if (value >= min - tolerance && value <= max + tolerance) return 0.5;
    return 0;
};

const estimateMarketVolatility = (prices: number[]): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (!prices.length) return 'MEDIUM';
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    if (mean <= 0) return 'MEDIUM';
    const variance = prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length;
    const cv = Math.sqrt(variance) / mean;
    if (cv > 0.18) return 'HIGH';
    if (cv > 0.1) return 'MEDIUM';
    return 'LOW';
};

const findCropPrice = (crop: CropProfile, marketPrices: MarketPriceItem[]): number => {
    const match = marketPrices.find((m) => crop.commodityAliases.some((alias) => m.commodity.toLowerCase().includes(alias)));
    if (match) return match.modal_price;

    const avgAll = marketPrices.reduce((sum, m) => sum + m.modal_price, 0) / Math.max(marketPrices.length, 1);
    return avgAll || 2000;
};

const formatReason = (input: {
    soilType: string;
    rainfallMm: number;
    temperatureC: number;
    crop: CropProfile;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}) => {
    return `Recommended because ${input.crop.name} suits ${input.soilType} soil, expected rainfall (~${Math.round(input.rainfallMm)} mm) and temperature (~${Math.round(input.temperatureC)}°C), with ${input.riskLevel.toLowerCase()} operational risk.`;
};

const validateRecommendationInput = (body: any): { valid: boolean; message?: string } => {
    const requiredFields = ['fieldSize', 'soilType', 'season', 'irrigation'];
    for (const field of requiredFields) {
        if (body[field] == null || body[field] === '') {
            return { valid: false, message: `Missing required field: ${field}` };
        }
    }

    const fieldSize = Number(body.fieldSize);
    if (!Number.isFinite(fieldSize) || fieldSize <= 0) {
        return { valid: false, message: 'Field size must be a positive number' };
    }

    return { valid: true };
};

/**
 * GET /api/market/prices
 * Fetch current market prices for commodities.
 * Currently returns mock data simulating eNAM response.
 */
router.get('/market/prices', async (req, res) => {
    try {
        const commodity = typeof req.query.commodity === 'string' ? req.query.commodity : undefined;
        const state = typeof req.query.state === 'string' ? req.query.state : undefined;
        const district = typeof req.query.district === 'string' ? req.query.district : undefined;

        const data = await fetchDataGovMarketPrices({ commodity, state, district, limit: 80 });

        res.json({
            success: true,
            data,
            source: data === MOCK_MANDI_PRICES ? 'fallback_mock' : 'data_gov_in'
        });
    } catch (error) {
        logger.error('Error fetching market prices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market prices'
        });
    }
});

/**
 * POST /api/market/recommend
 * Smart Crop Recommendation Engine (rule-based)
 */
router.post('/market/recommend', async (req, res) => {
    try {
        const validation = validateRecommendationInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const {
            fieldSize,
            soilType,
            season,
            irrigation,
            state,
            district,
            latitude,
            longitude,
        } = req.body;

        const numericFieldSize = toNumber(fieldSize);
        const cropIrrigation = irrigationLevelFromInput(irrigation);

        const marketPrices = await fetchDataGovMarketPrices({
            state: typeof state === 'string' ? state : undefined,
            district: typeof district === 'string' ? district : undefined,
            limit: 120
        });

        const lat = toNumber(latitude, 16.5);
        const lon = toNumber(longitude, 80.6);
        const currentWeather = await fetchCurrentWeather(lat, lon, req);
        const hourlyWeather = await fetchHourlyWeather(lat, lon, req, { forecastDays: 7, pastDays: 0 });

        const avgForecastRain = hourlyWeather?.reduce((sum, item) => {
            if (item.relativeHumidity == null) return sum;
            // Approximation: convert humidity signal to rainfall potential factor for rule input
            return sum + (item.relativeHumidity > 75 ? 2.5 : item.relativeHumidity > 60 ? 1.2 : 0.3);
        }, 0) ?? 420;

        const temperature = currentWeather?.temperature ?? 28;
        const soil = String(soilType).toLowerCase();

        const recommendations = CROP_PROFILES.map((crop) => {
            const soilScore = crop.soilTypes.includes(soil) ? 35 : 10;
            const rainfallScore = 30 * scoreRangeMatch(avgForecastRain, crop.rainfallRange[0], crop.rainfallRange[1]);
            const temperatureScore = 20 * scoreRangeMatch(temperature, crop.tempRange[0], crop.tempRange[1]);
            const irrigationScore = cropIrrigation === crop.irrigationNeed ? 15 : (cropIrrigation === 'HIGH' && crop.irrigationNeed !== 'HIGH') ? 10 : 5;
            const suitabilityScore = soilScore + rainfallScore + temperatureScore + irrigationScore;

            const marketPrice = findCropPrice(crop, marketPrices);
            const expectedRevenue = crop.avgYieldPerAcre * numericFieldSize * marketPrice;
            const estimatedCost = crop.avgCostPerAcre * numericFieldSize;
            const estimatedProfit = expectedRevenue - estimatedCost;
            const profitScore = Math.max(0, Math.min(100, estimatedProfit / 1200));

            const relevantPrices = marketPrices
                .filter((m) => crop.commodityAliases.some((alias) => m.commodity.toLowerCase().includes(alias)))
                .map((m) => m.modal_price);
            const volatility = estimateMarketVolatility(relevantPrices);

            let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
            let riskPenalty = 8;

            if (crop.irrigationNeed === 'HIGH' && avgForecastRain < 550 && cropIrrigation !== 'HIGH') {
                riskLevel = 'HIGH';
                riskPenalty += 24;
            }

            if (volatility === 'HIGH') {
                riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
                riskPenalty += 15;
            }

            if (crop.climateResilient) {
                riskPenalty -= 6;
            }

            const finalScore = suitabilityScore + (profitScore * 0.5) - riskPenalty;

            return {
                cropKey: crop.key,
                cropName: crop.name,
                suitabilityScore: Math.round(suitabilityScore),
                profitScore: Math.round(profitScore),
                finalScore: Math.round(finalScore),
                estimatedCost: Math.round(estimatedCost),
                expectedRevenue: Math.round(expectedRevenue),
                estimatedProfit: Math.round(estimatedProfit),
                riskLevel,
                riskPenalty: Math.round(riskPenalty),
                marketPrice: Math.round(marketPrice),
                reason: formatReason({
                    soilType: soil,
                    rainfallMm: avgForecastRain,
                    temperatureC: temperature,
                    crop,
                    riskLevel,
                })
            };
        })
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, 3);

        return res.json({
            success: true,
            source: {
                market: 'data_gov_in',
                weather: currentWeather ? 'open_meteo' : 'fallback_estimate'
            },
            inputSummary: {
                fieldSize: numericFieldSize,
                soilType: soil,
                season,
                irrigation: cropIrrigation,
                state: state || null,
                district: district || null,
                latitude: lat,
                longitude: lon,
            },
            weatherSnapshot: {
                temperature,
                rainfallForecastMm: Math.round(avgForecastRain),
                humidity: currentWeather?.relativeHumidity ?? null,
                windSpeed: currentWeather?.windSpeed ?? null,
            },
            recommendations,
            marketPreview: marketPrices.slice(0, 10),
        });
    } catch (error) {
        logger.error('Error generating smart crop recommendation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate smart crop recommendation'
        });
    }
});

export const marketRouter = router;
