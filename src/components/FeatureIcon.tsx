import React from 'react';

type IconType = 'SCANNER' | 'AGRITWIN' | 'BIOPROSPECTOR' | 'MARKET';

interface FeatureIconProps {
    type: IconType;
    className?: string;
}

export const FeatureIcon: React.FC<FeatureIconProps> = ({ type, className = "w-12 h-12" }) => {
    switch (type) {
        case 'SCANNER':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <defs>
                        <linearGradient id="scannerGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                    </defs>
                    <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z" stroke="url(#scannerGrad)" fill="rgba(16, 185, 129, 0.1)" />
                    <path d="M12 2v10" stroke="#059669" strokeWidth="2" />
                    <path d="M12 22v-3" />
                    <path d="M9 7l3 3 3-3" />
                </svg>
            );
        case 'AGRITWIN':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <defs>
                        <linearGradient id="twinGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#2563EB" />
                        </linearGradient>
                    </defs>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="url(#twinGrad)" fill="rgba(59, 130, 246, 0.1)" />
                    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
                    <path d="M12 22.08V12" />
                    <circle cx="12" cy="12" r="2" fill="#3B82F6" stroke="none" />
                </svg>
            );
        case 'BIOPROSPECTOR':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <defs>
                        <linearGradient id="bioGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                    </defs>
                    <path d="M12 22v-7" stroke="#7C3AED" strokeWidth="2" />
                    <path d="M12 15a5 5 0 0 0-5-5c0-3 3-5 5-8 2 3 5 5 5 8a5 5 0 0 0-5 5Z" stroke="url(#bioGrad)" fill="rgba(139, 92, 246, 0.1)" />
                    <path d="M7 21h10" />
                    <circle cx="12" cy="8" r="1.5" fill="#8B5CF6" stroke="none" />
                </svg>
            );
        case 'MARKET':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
                    <defs>
                        <linearGradient id="marketGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                    </defs>
                    <path d="M3 3v18h18" stroke="#D97706" />
                    <path d="M18 17V9" stroke="url(#marketGrad)" />
                    <path d="M13 17V5" stroke="url(#marketGrad)" />
                    <path d="M8 17v-3" stroke="url(#marketGrad)" />
                    <circle cx="13" cy="5" r="1" fill="#F59E0B" />
                    <path d="M7 14l5-9 5 4" stroke="#D97706" strokeDasharray="2 2" />
                </svg>
            );
        default:
            return null;
    }
};
