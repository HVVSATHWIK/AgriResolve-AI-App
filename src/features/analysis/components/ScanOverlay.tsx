import React from 'react';
import { motion } from 'framer-motion';

export const ScanOverlay: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    if (!isActive) return null;

    // Keep random points stable during an active scan so they don't "jump" on re-render.
    const points = React.useMemo(() => {
        return Array.from({ length: 5 }).map(() => ({
            top: Math.random() * 80 + 10,
            left: Math.random() * 80 + 10,
            repeatDelay: Math.random() * 2,
        }));
    }, []);

    return (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
            {/* Pulsing Grid Background */}
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* High-Tech Laser Scan Line */}
            <motion.div
                className="absolute w-full h-16 bg-gradient-to-b from-green-500/0 via-green-500/50 to-green-500/0 border-b-2 border-green-400 box-shadow-[0_0_15px_rgba(74,222,128,0.8)]"
                initial={{ top: "-10%" }}
                animate={{ top: "110%" }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            {/* Random "Detection" Points */}
            <div className="absolute inset-0">
                {points.map((p, idx) => (
                    <motion.div
                        key={idx}
                        className="absolute w-4 h-4 border border-green-400 rounded-full flex items-center justify-center bg-green-500/20"
                        style={{
                            top: `${p.top}%`,
                            left: `${p.left}%`,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: [0, 1.5, 1],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: (idx + 1) * 0.4,
                            repeatDelay: p.repeatDelay
                        }}
                    >
                        <div className="w-1 h-1 bg-green-400 rounded-full" />
                    </motion.div>
                ))}
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl-lg shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr-lg shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl-lg shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-lg shadow-[0_0_10px_rgba(34,197,94,0.5)]" />

            {/* Analyzing Text */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-green-500/50 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <p className="text-green-400 text-xs font-mono font-bold tracking-wider">
                    SCANNING BIOLOGICAL SIGNATURES...
                </p>
            </div>
        </div>
    );
};
