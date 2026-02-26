import React, { useEffect, useState } from 'react';
import { fetchCropCalendar, type CropCalendarEvent } from '../services/insights';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    locationName: string;
}

export const InsightsDashboard: React.FC<Props> = ({ locationName }) => {
    const { t, i18n } = useTranslation();
    const [calendar, setCalendar] = useState<CropCalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!locationName) return;

        const load = async () => {
            setLoading(true);
            const _calendar = await fetchCropCalendar(locationName, i18n.language);
            setCalendar(_calendar);
            setLoading(false);
        };

        load();
    }, [locationName]);

    if (!locationName) return null;

    const stageLabel = (raw: string) => {
        const normalized = (raw || '').trim().toLowerCase();
        if (normalized === 'growing') return t('stage_growing', { defaultValue: raw });
        if (normalized === 'sowing/growing') return t('stage_sowing_growing', { defaultValue: raw });
        if (normalized === 'harvesting') return t('stage_harvesting', { defaultValue: raw });
        if (normalized === 'sowing') return t('stage_sowing', { defaultValue: raw });
        if (normalized === 'harvest') return t('stage_harvest', { defaultValue: raw });
        return raw;
    };



    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Disease Alerts Ticker REMOVED - Violation of Reality Rule */}

            {/* Crop Calendar - Now the primary insight */}
            <div className="bg-white border border-emerald-100 rounded-xl p-0 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{t('seasonal_planner', { defaultValue: 'Seasonal Planner' })}</span>
                    </div>
                    {locationName && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">
                            {locationName}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-white/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-200">
                        {calendar.map((event, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-lg border border-green-50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-green-900">{event.crop}</h4>
                                    <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium">
                                        {stageLabel(event.stage)}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                    <span className="font-medium text-green-700">{event.timing}</span>
                                    <span>•</span>
                                    <span>{event.notes}</span>
                                </div>
                            </div>
                        ))}
                        {calendar.length === 0 && !loading && (
                            <div className="text-xs text-gray-500 text-center py-4">
                                {t('no_seasonal_data', { defaultValue: 'No seasonal data available.' })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
