import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, MapPin, Loader2 } from 'lucide-react';
import { useAIChat } from '../features/assistant/hooks/useAIChat';

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [location, setLocation] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Get Location on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        // 1. Reverse Geocoding (Address)
                        const addressRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const addressData = await addressRes.json();
                        const addressRaw = addressData.display_name || `${latitude}, ${longitude}`;

                        // 2. Weather Data (Open-Meteo)
                        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
                        const weatherData = await weatherRes.json();

                        let weatherString = "";
                        if (weatherData.current) {
                            const { temperature_2m, relative_humidity_2m, wind_speed_10m } = weatherData.current;
                            weatherString = ` | Temp: ${temperature_2m}°C, Humidity: ${relative_humidity_2m}%, Wind: ${wind_speed_10m} km/h`;
                        }

                        const locString = `Detected Location: ${addressRaw}${weatherString}`;
                        setLocation(locString);
                    } catch (err) {
                        console.error("Error fetching context:", err);
                        setLocation(`Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    } finally {
                        setIsLocating(false);
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setIsLocating(false);
                    setLocation("Location access denied or unavailable.");
                }
            );
        } else {
            setLocation("Geolocation not supported by this browser.");
        }
    }, []);

    const { messages, isLoading, sendMessage } = useAIChat(null, location);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[90vw] md:w-[400px] h-[500px] flex flex-col overflow-hidden animate-fade-in mb-2">
                    {/* Header */}
                    <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
                        <div className="flex flex-col">
                            <h3 className="font-bold flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                Agri-Assistant
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-emerald-100 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[250px]">
                                    {isLocating ? "Locating..." : (location || "Unknown Location")}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-emerald-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-10 text-sm">
                                <p>Hello! I&apos;m here to help.</p>
                                <p>Ask me anything about your crops.</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.sender === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                    }`}>
                                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl p-3 rounded-bl-none shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center ${isOpen
                    ? 'bg-gray-700 text-white'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>
        </div>
    );
};
