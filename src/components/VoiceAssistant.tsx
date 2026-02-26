import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VoiceAssistant: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const navigate = useNavigate();

    // Browser Speech Recognition Support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    useEffect(() => {
        if (!recognition) return;

        recognition.continuous = false;
        recognition.lang = 'en-IN'; // Support Indian English
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.maxAlternatives = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const command = event.results[0][0].transcript.toLowerCase();
            setTranscript(command);
            handleCommand(command);
            setIsListening(false);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            speak("I didn't catch that. Please try again.");
        };

        recognition.onend = () => {
            setIsListening(false);
        };
    }, []);

    const toggleListening = () => {
        if (!recognition) {
            alert("Voice assistant is not supported in this browser.");
            return;
        }

        if (isListening) {
            try {
                recognition.stop();
            } catch (e) {
                console.warn("Recognition stop error:", e);
                setIsListening(false);
            }
        } else {
            speak("I am listening...");
            try {
                recognition.start();
                setIsListening(true);
            } catch (e) {
                console.error("Recognition start error:", e);
                // VOC-003: Handle "already started" or permission errors gracefully
                setIsListening(false);
                speak("Voice error. Please try again.");
            }
        }
    };

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handleCommand = (cmd: string) => {
        console.log("Voice Command:", cmd);

        // Navigation Commands
        if (cmd.includes('home') || cmd.includes('dashboard')) {
            speak("Going to Dashboard.");
            navigate('/dashboard');
        } else if (cmd.includes('sim') || cmd.includes('farm') || cmd.includes('game')) {
            speak("Opening Farming Simulator.");
            navigate('/simulator');
        } else if (cmd.includes('market') || cmd.includes('price')) {
            speak("Opening Market Prices.");
            navigate('/market');
        } else if (cmd.includes('doctor') || cmd.includes('diagnos') || cmd.includes('plant')) {
            speak("Opening Crop Doctor.");
            navigate('/diagnosis');
        } else if (cmd.includes('weather')) {
            speak("Reading weather report...");
            // (Mock) In a real app, this would read current weather state
            speak("It is currently sunny. Good for planting.");
        } else if (cmd.includes('help') || cmd.includes('what can you do')) {
            speak("You can say: Go to Farm, Check Market, Crop Doctor, or Weather.");
        } else {
            speak("Sorry, I don't know that command.");
        }
    };

    if (!recognition) return null; // Hide if not supported

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {transcript && (
                <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm mb-2 backdrop-blur-sm animate-fade-in">
                    &quot;{transcript}&quot;
                </div>
            )}

            <button
                onClick={toggleListening}
                className={`p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center ${isListening
                    ? 'bg-red-500 animate-pulse text-white'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
            >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <div className={`text-xs font-bold px-2 py-1 rounded bg-white shadow-sm transition-opacity ${isListening ? 'opacity-100' : 'opacity-0'}`}>
                Listening...
            </div>
        </div>
    );
};
