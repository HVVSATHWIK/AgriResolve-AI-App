import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FeatureIcon } from '../components/FeatureIcon';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const apps = [
        {
            id: 'scanner',
            title: t('app_scanner_title', 'Crop Scanner'),
            desc: t('app_scanner_desc', 'AI-powered disease diagnosis'),
            iconType: 'SCANNER' as const,
            color: 'bg-green-50 text-green-600 border-green-100',
            action: () => navigate('/diagnosis'),
            status: 'Active'
        },
        {
            id: 'agritwin',
            title: t('app_agritwin_title', 'Agri-Twin'),
            desc: t('app_agritwin_desc', 'Risk-free farming simulator'),
            iconType: 'AGRITWIN' as const,
            color: 'bg-blue-50 text-blue-600 border-blue-100',
            action: () => navigate('/simulator'),
            status: 'Active'
        },
        {
            id: 'bioprospector',
            title: t('app_bio_title', 'Bio-Prospector'),
            desc: t('app_bio_desc', 'Discover hidden value in weeds'),
            iconType: 'BIOPROSPECTOR' as const,
            color: 'bg-purple-50 text-purple-600 border-purple-100',
            action: () => navigate('/diagnosis?mode=bioprospector'), // Distinct mode
            status: 'Active'
        },
        {
            id: 'market',
            title: t('app_market_title', 'Market Pulse'),
            desc: t('app_market_desc', 'Real-time prices & cooperative selling'),
            iconType: 'MARKET' as const,
            color: 'bg-orange-50 text-orange-600 border-orange-100',
            action: () => navigate('/market'),
            status: 'Active'
        }
    ];

    return (
        <Layout onNewAnalysis={() => navigate('/diagnosis')}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl">
                    <h1 className="text-3xl font-black mb-2">{t('dashboard_welcome', 'Welcome, Farmer')}</h1>
                    <p className="text-green-100 font-medium max-w-lg">
                        {t('dashboard_subtitle', 'Your integrated command center for farm management, resilience, and growth.')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {apps.map((app) => (
                        <div
                            key={app.id}
                            onClick={app.action}
                            className={`
                                relative p-6 rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer group
                                ${app.status === 'Coming Soon' ? 'opacity-70 grayscale-[0.5]' : 'border-gray-100 hover:border-green-300'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${app.color}`}>
                                    <FeatureIcon type={app.iconType} className="w-8 h-8" />
                                </div>
                                {app.status === 'Coming Soon' && (
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                        Coming Soon
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{app.title}</h3>
                            <p className="text-sm text-gray-500 font-medium mb-4">{app.desc}</p>

                            {app.status === 'Active' && (
                                <div className="flex items-center text-green-600 text-sm font-bold group-hover:gap-2 transition-all">
                                    {t('open_app', 'Open App')} <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};
