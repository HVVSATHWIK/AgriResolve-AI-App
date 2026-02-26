import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ShoppingBag, ArrowUpRight, IndianRupee, MapPin } from 'lucide-react';
import { fetchMarketPrices, MarketPrice } from '../services/marketService';

export const Marketplace: React.FC = () => {
    const { t } = useTranslation();
    const [prices, setPrices] = useState<MarketPrice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await fetchMarketPrices();
            setPrices(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                            {t('market_pulse', { defaultValue: 'Market Pulse' })}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('live_prices_subtitle', { defaultValue: 'Real-time mandi prices from eNAM' })}
                        </p>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        <span className="hidden md:inline">{t('sell_crop', { defaultValue: 'Sell Crop' })}</span>
                    </button>
                </header>

                {/* Price Ticker / Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        // Skeleton Loading
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-32" />
                        ))
                    ) : (
                        prices.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <TrendingUp className="w-24 h-24 text-green-800" />
                                </div>

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{item.commodity}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full w-fit mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {item.market}, {item.state}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-black text-gray-900 flex items-center justify-end gap-0.5">
                                            <IndianRupee className="w-5 h-5 text-gray-400" />
                                            {item.modal_price}
                                        </span>
                                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                            <ArrowUpRight className="w-3 h-3" />
                                            +2.4%
                                        </span>
                                    </div>
                                </div>

                                <div className="relative z-10 grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        <span className="block text-xs text-gray-400 mb-0.5">{t('min_price', { defaultValue: 'Min Price' })}</span>
                                        <span className="font-semibold text-gray-700">₹{item.min_price}</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                        <span className="block text-xs text-gray-400 mb-0.5">{t('max_price', { defaultValue: 'Max Price' })}</span>
                                        <span className="font-semibold text-gray-700">₹{item.max_price}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sell Offer CTA */}
                <div className="bg-gradient-to-r from-green-800 to-green-900 rounded-2xl p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-2">{t('connect_buyers', { defaultValue: 'Connect with Buyers' })}</h2>
                        <p className="text-green-100 text-sm mb-6 max-w-md">
                            {t('connect_buyers_desc', { defaultValue: 'List your harvest directly on the AgriResolve network. Get better prices by bypassing middlemen.' })}
                        </p>
                        <button className="bg-white text-green-900 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-colors shadow-lg">
                            {t('start_selling', { defaultValue: 'Start Selling' })}
                        </button>
                    </div>

                    {/* Decorative background elements */}
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                        <ShoppingBag className="w-64 h-64" />
                    </div>
                </div>
            </div>
        </div>
    );
};
