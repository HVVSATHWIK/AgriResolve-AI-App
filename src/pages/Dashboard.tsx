import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Activity, Sprout, TrendingUp, Scan } from 'lucide-react';
import { HistoryService } from '../features/history/services/HistoryService';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [lastScanDate, setLastScanDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchLastScan = async () => {
            try {
                const records = await HistoryService.getAllRecords();
                if (records.length > 0) {
                    // records are already sorted by timestamp desc in getAllRecords
                    const lastRecord = records[0];
                    setLastScanDate(new Date(lastRecord.timestamp).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch history for dashboard", error);
            }
        };
        fetchLastScan();
    }, []);

    const apps = [
        {
            id: 'scanner',
            title: t('app_scanner_title', 'Crop Scanner'),
            desc: t('app_scanner_desc', 'AI-powered disease diagnosis'),
            // V4.1: Real Data from HistoryService
            data: lastScanDate ? { label: 'Last Scan', value: lastScanDate } : undefined,
            actionLabel: t('action_scan', 'Start Diagnosis'),
            icon: Scan,
            action: () => navigate('/diagnosis'),
            status: 'Active',
            isFlagship: true
        },
        {
            id: 'agritwin',
            title: t('app_agritwin_title', 'Farm Simulator'),
            desc: t('app_agritwin_desc', 'Risk-free farming simulator'),
            actionLabel: t('action_simulate', 'Simulate Farm'),
            icon: Activity,
            action: () => navigate('/simulator'),
            status: 'Active',
            isFlagship: false
        },
        {
            id: 'bioprospector',
            title: t('app_bio_title', 'Weed Analyzer'),
            desc: t('app_bio_desc', 'Identify medicinal value in weeds'),
            actionLabel: t('action_discover', 'Analyze Weeds'),
            icon: Sprout,
            action: () => navigate('/diagnosis?mode=bioprospector'),
            status: 'Active',
            isFlagship: false
        },
        {
            id: 'market',
            title: t('app_market_title', 'Market Pulse'),
            desc: t('app_market_desc', 'Real-time prices & cooperative selling'),
            actionLabel: t('action_market', 'Analyze Market'),
            icon: TrendingUp,
            action: () => navigate('/market'),
            status: 'Active',
            isFlagship: false
        }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Section - The "Situation Room" (Reality Check: Welcome Message Restored) */}
            <div className="relative overflow-hidden rounded-[2rem] p-6 md:p-10 text-white shadow-2xl transition-all hover:shadow-emerald-900/40 group bg-[#022c22]">
                {/* Backgrounds - High Contrast for Field Visibility */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] opacity-95 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0"></div>

                {/* Subtle animated accent */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>

                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 backdrop-blur-md mb-4 shadow-inner">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></span>
                        <span className="text-[10px] font-bold tracking-widest text-emerald-100 uppercase font-mono">System Active</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight text-white drop-shadow-sm">
                        {t('dashboard_welcome', 'Welcome, Farmer')}
                        <span className="text-amber-400">.</span>
                    </h1>

                    <p className="text-emerald-100/80 text-lg font-medium leading-relaxed max-w-2xl pl-1">
                        {t('dashboard_subtitle', 'Your integrated command center for farm management, resilience, and growth.')}
                    </p>
                </div>
            </div>

            {/* Apps Grid - Functional Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
                {apps.map((app) => (
                    <div
                        key={app.id}
                        onClick={app.action}
                        className={`
                            relative rounded-[2rem] border transition-all duration-200 cursor-pointer group flex flex-col justify-between overflow-hidden
                            ${app.isFlagship
                                ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#064e3b] to-[#047857] border-emerald-800 shadow-xl' // High contrast Green
                                : 'bg-white border-emerald-100 shadow-sm hover:shadow-xl hover:border-emerald-400'
                            }
                            active:scale-[0.98] // Tactile feedback
                        `}
                    >
                        {/* Touch Target Expansion */}
                        <div className="absolute inset-0 z-0" aria-hidden="true"></div>

                        <div className="p-6 md:p-8 h-full flex flex-col relative z-10">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`
                                    p-3 rounded-xl flex items-center justify-center shadow-md
                                    ${app.isFlagship ? 'bg-emerald-900/50 text-white ring-1 ring-white/20' : 'bg-emerald-50 text-emerald-700'}
                                `}>
                                    <app.icon className="w-6 h-6" />
                                </div>

                                {/* Live Data Pills (Only if real data exists) */}
                                {app.data && (
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${app.isFlagship ? 'bg-emerald-900/30 text-emerald-100 border-emerald-500/30' : 'bg-gray-50 text-gray-600 border-gray-200'} `}>
                                        <span className="opacity-70 mr-1">{app.data.label}:</span>
                                        {app.data.value}
                                    </div>
                                )}

                                {app.status === 'Coming Soon' && (
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase border border-gray-200">
                                        Soon
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 mb-6">
                                <h3 className={`font-black tracking-tight mb-1 ${app.isFlagship ? 'text-3xl text-white' : 'text-xl text-gray-900 group-hover:text-emerald-900'} `}>
                                    {app.title}
                                </h3>
                                <p className={`font-medium ${app.isFlagship ? 'text-emerald-100/80 text-lg' : 'text-gray-500 text-sm'} `}>
                                    {app.desc}
                                </p>
                            </div>

                            {/* Massive CTA for Field Use */}
                            {app.status === 'Active' && (
                                <button className={`
                                    w-full py-4 px-6 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-between transition-colors
                                    ${app.isFlagship
                                        ? 'bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-lg'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-transparent hover:border-emerald-200'
                                    }
                                `}>
                                    {app.actionLabel}
                                    <ArrowRight className={`w-5 h-5 ${app.isFlagship ? 'stroke-[3px]' : ''} `} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
