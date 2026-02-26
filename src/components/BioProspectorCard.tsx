import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Leaf, Beaker, Lightbulb } from 'lucide-react';
import { BioProspectorResult } from '../types';

interface BioProspectorCardProps {
    result?: BioProspectorResult;
}

export const BioProspectorCard: React.FC<BioProspectorCardProps> = ({ result }) => {
    const { t } = useTranslation();

    if (!result || (!result.medicinal_uses.length && !result.commercial_uses.length)) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 shadow-lg relative overflow-hidden animate-in fade-in duration-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

            <h2 className="text-xl font-bold text-emerald-900 mb-2 flex items-center gap-3 relative z-10">
                <Sparkles className="w-6 h-6 text-emerald-600" />
                {t('hidden_value', { defaultValue: 'Bio-Prospector: Hidden Value' })}
            </h2>

            <div className="mb-6 relative z-10">
                <h3 className="text-lg font-semibold text-emerald-800">
                    {result.plant_name} <span className="text-sm font-normal text-emerald-600 italic">({result.scientific_name})</span>
                </h3>
                <p className="text-sm text-emerald-700/80 mt-1">
                    {t('bio_prospector_subtitle', { defaultValue: 'This plant has potential beyond simple weed control.' })}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {/* Medicinal / Traditional Uses */}
                {result.medicinal_uses.length > 0 && (
                    <div className="bg-white/60 rounded-xl p-5 border border-emerald-100/50 backdrop-blur-sm">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Leaf className="w-4 h-4" />
                            {t('medicinal_traditional', { defaultValue: 'Medicinal & Traditional' })}
                        </h4>
                        <ul className="space-y-2">
                            {result.medicinal_uses.map((use, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                    {use}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Commercial / Biomass Uses */}
                {result.commercial_uses.length > 0 && (
                    <div className="bg-white/60 rounded-xl p-5 border border-emerald-100/50 backdrop-blur-sm">
                        <h4 className="text-xs font-bold text-teal-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Beaker className="w-4 h-4" />
                            {t('commercial_biomass', { defaultValue: 'Commercial & Biomass' })}
                        </h4>
                        <ul className="space-y-2">
                            {result.commercial_uses.map((use, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-teal-900">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                                    {use}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Practical Tips */}
            {result.tips.length > 0 && (
                <div className="mt-6 bg-emerald-100/50 rounded-xl p-4 border border-emerald-200/50 flex items-start gap-3 relative z-10">
                    <Lightbulb className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="text-sm text-emerald-800">
                        <span className="font-bold block mb-1">{t('pro_tip', { defaultValue: 'Pro Tip:' })}</span>
                        {result.tips.join(' ')}
                    </div>
                </div>
            )}
        </div>
    );
};
