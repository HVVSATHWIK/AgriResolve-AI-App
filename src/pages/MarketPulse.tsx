import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Clock, Sprout, ArrowRight, Activity, AlertTriangle } from 'lucide-react';

// --- Data Interfaces ---
interface MarketItem {
    id: string;
    crop: string;
    price: number; // Current Price (₹/Qt)
    change: number; // Percent Change
    trend: 'UP' | 'DOWN' | 'STABLE';
    volatility: 'LOW' | 'MED' | 'HIGH';
    recommendation: 'SELL' | 'HOLD';
}

interface TreasureItem {
    id: string;
    name: string;
    botanical: string;
    type: 'MEDICINAL' | 'BIO-FERTILIZER';
    price_est: string; // "100-120 ₹/kg"
    demand: 'HIGH' | 'MED' | 'LOW';
    buyer_count: number;
    distance_km: number;
}

// --- Mock Data ---
const MARKET_DATA: MarketItem[] = [
    { id: '1', crop: 'Cotton (Kapus)', price: 6850, change: 2.4, trend: 'UP', volatility: 'HIGH', recommendation: 'HOLD' },
    { id: '2', crop: 'Red Chilli', price: 18500, change: -1.2, trend: 'DOWN', volatility: 'MED', recommendation: 'SELL' },
    { id: '3', crop: 'Paddy (Basmati)', price: 3200, change: 0.5, trend: 'UP', volatility: 'LOW', recommendation: 'HOLD' },
    { id: '4', crop: 'Turmeric', price: 7100, change: -3.5, trend: 'DOWN', volatility: 'HIGH', recommendation: 'HOLD' }, // Price dropping but might rebound? Or sell stop loss
    { id: '5', crop: 'Soybean', price: 4200, change: 1.1, trend: 'UP', volatility: 'MED', recommendation: 'SELL' },
];

const TREASURE_DATA: TreasureItem[] = [
    { id: 't1', name: 'Bala (Sida)', botanical: 'Sida cordifolia', type: 'MEDICINAL', price_est: '100 - 120 ₹/kg', demand: 'HIGH', buyer_count: 3, distance_km: 15 },
    { id: 't2', name: 'Aloe Vera', botanical: 'Aloe barbadensis', type: 'MEDICINAL', price_est: '5 - 8 ₹/leaf', demand: 'MED', buyer_count: 1, distance_km: 40 },
    { id: 't3', name: 'Neem Cake', botanical: 'Azadirachta indica', type: 'BIO-FERTILIZER', price_est: '25 - 30 ₹/kg', demand: 'HIGH', buyer_count: 12, distance_km: 5 },
];

// --- Components ---

const Ticker = () => {
    return (
        <div className="bg-black/90 text-white overflow-hidden py-2 border-b border-white/10 flex whitespace-nowrap">
            <motion.div
                className="flex gap-8 px-4"
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            >
                {[...MARKET_DATA, ...MARKET_DATA, ...MARKET_DATA].map((item, i) => ( // Triple for inf loop illusion
                    <div key={i} className="flex items-center gap-2 text-sm font-mono">
                        <span className="font-bold text-gray-400">{item.crop}</span>
                        <span className={item.trend === 'UP' ? 'text-emerald-400' : 'text-rose-400'}>
                            ₹{item.price}
                        </span>
                        <span className={`text-xs ${item.trend === 'UP' ? 'text-emerald-500' : 'text-rose-500'} bg-white/5 px-1 rounded`}>
                            {item.trend === 'UP' ? '▲' : '▼'} {Math.abs(item.change)}%
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

const Gauge = ({ value, label }: { value: number, label: string }) => {
    // Value -1 (Sell) to 1 (Hold)
    const angle = value * 90; // -90 to 90

    return (
        <div className="relative w-48 h-24 overflow-hidden mx-auto mt-4">
            {/* Background Arc */}
            <div className="absolute w-44 h-44 rounded-full border-[12px] border-gray-200 top-0 left-2 box-border border-b-0 border-l-0 border-r-0"
                style={{ borderBottomColor: 'transparent', borderRightColor: 'transparent', borderLeftColor: 'transparent', transform: 'rotate(-45deg)', borderRadius: '50%' }}></div>

            {/* Colored Zones (Simplified with CSS gradient on a div masked) */}
            <div className="absolute bottom-0 left-1/2 w-40 h-20 -translate-x-1/2 bg-gradient-to-r from-rose-500 via-yellow-400 to-emerald-500 rounded-t-full opacity-20"></div>

            {/* Needle */}
            <motion.div
                initial={{ rotate: -90 }}
                animate={{ rotate: angle }}
                transition={{ type: 'spring', damping: 10 }}
                className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-800 origin-bottom rounded-full -translate-x-1/2 z-10"
            />

            {/* Center Cap */}
            <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-900 rounded-full -translate-x-1/2 translate-y-1/2 z-20"></div>

            <div className="absolute top-8 left-1/2 -translate-x-1/2 font-black text-2xl tracking-tighter">
                {label}
            </div>
        </div>
    );
};

export const MarketPulse: React.FC = () => {
    const { t } = useTranslation();
    const [selectedCrop, setSelectedCrop] = useState(MARKET_DATA[0]);

    // Gauge Value Logic
    const gaugeValue = selectedCrop.recommendation === 'HOLD' ? 0.7 : -0.7;

    return (
        <div className="pb-20">
            {/* Header / Ticker */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
                <Ticker />
                <div className="p-4 flex justify-between items-center max-w-5xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                            <Activity className="text-blue-600" /> Market Pulse
                        </h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Financial Intelligence Engine</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-gray-800">APMC Guntur</div>
                        <div className="text-xs text-green-600 flex items-center justify-end gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-4 space-y-8">

                {/* STREAM A: MAINSTREAM PULSE */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-800">{t('market_mainstream', 'Mainstream Pulse')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 1. Crop Selector List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                                Watchlist
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                                {MARKET_DATA.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedCrop(item)}
                                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedCrop.id === item.id ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-gray-700">{item.crop}</div>
                                            <div className="text-xs text-gray-400">Vol: {item.volatility}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-gray-900">₹{item.price}</div>
                                            <div className={`text-xs ${item.trend === 'UP' ? 'text-green-500' : 'text-red-500'}`}>
                                                {item.change > 0 ? '+' : ''}{item.change}%
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. The Big Gauge (Decision Support) */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-white p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <DollarSign className="w-32 h-32 text-gray-900" />
                            </div>

                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="text-center">
                                    <div className="text-sm text-gray-500 font-medium mb-2 uppercase tracking-wide">{t('market_recommendation', 'Signal')} for {selectedCrop.crop}</div>
                                    <Gauge value={gaugeValue} label={selectedCrop.recommendation === 'HOLD' ? t('market_hold', 'Hold') : selectedCrop.recommendation} />
                                    <div className="mt-4 flex justify-center gap-4 text-xs font-bold">
                                        <span className="text-rose-500">{t('market_sell', 'REDUCE EXPOSURE')}</span>
                                        <span className="text-emerald-600">{t('market_buy', 'ACCUMULATE')}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs text-gray-500 font-bold uppercase">Best Time to Sell</span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-800">
                                            {selectedCrop.recommendation === 'HOLD' ? 'Next Week (Proj: +3%)' : 'Immediately (Prices Cooling)'}
                                        </div>
                                    </div>

                                    {selectedCrop.volatility === 'HIGH' && (
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                            <div>
                                                <div className="text-sm font-bold text-amber-800">High Volatility Alert</div>
                                                <div className="text-xs text-amber-700 mt-1">
                                                    Prices are fluctuating rapidly due to international export bans. Updates every 15 mins.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* STREAM B: TREASURE PULSE (Bio-Prospector) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 mt-8">
                        <Sprout className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-bold text-gray-800">{t('market_treasure', 'Treasure Pulse (Bio-Valuation)')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {TREASURE_DATA.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 italic font-serif">{item.botanical}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${item.type === 'MEDICINAL' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {item.type}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-end justify-between border-b border-gray-50 pb-4">
                                        <div className="text-sm text-gray-500">Est. Value</div>
                                        <div className="text-2xl font-black text-gray-800">{item.price_est}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Demand</div>
                                            <div className={`font-bold ${item.demand === 'HIGH' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {item.demand}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Buyers</div>
                                            <div className="font-bold text-gray-800">{item.buyer_count} Nearby</div>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2 group-hover:bg-purple-600 transition-colors">
                                        Find Buyers <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};
