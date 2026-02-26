import React, { useState, useEffect, useRef } from 'react';
import { useAIChat } from '../features/assistant/hooks/useAIChat';
import { REGION_DATA, RegionType } from '../features/simulation/SimulationEngine';
import { Send, User, Bot, MapPin } from 'lucide-react';

export const ChatAssistant: React.FC = () => {
    // Location Context State
    const [selectedRegion, setSelectedRegion] = useState<RegionType>('NORTH');

    // Derived location string for the AI
    const locationContext = `Region: ${REGION_DATA[selectedRegion].name}. Weather Bias: ${REGION_DATA[selectedRegion].weatherBias}. Common Crops: ${REGION_DATA[selectedRegion].crops.join(', ')}.`;

    const { messages, isLoading, sendMessage, toggleChat, isOpen } = useAIChat(null, locationContext);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-open chat on mount
    useEffect(() => {
        if (!isOpen) toggleChat();
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 p-4 pb-24 md:pb-8 flex flex-col max-w-4xl mx-auto">
            {/* Header with Location Selector */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 mb-4 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-full">
                        <Bot className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Field Assistant</h1>
                        <p className="text-xs text-gray-500">AI Agronomist • Online</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-stone-100 px-3 py-2 rounded-xl">
                    <MapPin className="w-4 h-4 text-stone-500" />
                    <span className="text-xs font-bold text-stone-600 uppercase">Context:</span>
                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value as RegionType)}
                        className="bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer"
                    >
                        {(Object.keys(REGION_DATA) as RegionType[]).map(region => (
                            <option key={region} value={region}>{REGION_DATA[region].name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 flex flex-col overflow-hidden h-[60vh] md:h-[70vh]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-none'
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                }`}>
                                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                                    {msg.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                    <span>{msg.sender === 'user' ? 'You' : 'Agri-Bot'}</span>
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 rounded-2xl p-4 rounded-bl-none flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2 relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={`Ask about ${REGION_DATA[selectedRegion].crops.join(', ')}...`}
                            className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-400 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
