import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, TrendingUp, Gamepad2, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MobileBottomNav: React.FC = () => {
    const { t } = useTranslation();

    const navItems = [
        { to: "/", icon: LayoutGrid, label: t('nav_home', "Hub") },
        { to: "/chat", icon: MessageSquare, label: t('assistant_title', "Assistant") },
        { to: "/market", icon: TrendingUp, label: t('nav_market', "Market") },
        { to: "/simulator", icon: Gamepad2, label: t('nav_sim', "Twin") },
        { to: "/history", icon: Home, label: t('nav_history', "History") },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-emerald-100 px-4 py-2 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-inset-bottom">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
              flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300
              ${isActive ? 'text-emerald-700 bg-emerald-100 scale-110 shadow-sm' : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-50'}
            `}
                >
                    <item.icon className={`transition-transform duration-300 ${item.label === 'Twin' ? 'w-9 h-9' : 'w-7 h-7'}`} strokeWidth={2.5} />
                    <span className="text-[9px] font-extrabold tracking-widest uppercase mt-1">{item.label}</span>
                </NavLink>
            ))}
        </div>
    );
};
