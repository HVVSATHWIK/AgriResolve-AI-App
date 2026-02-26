import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, ContactShadows } from '@react-three/drei';
import { SimulationState, CROP_DATA } from './SimulationEngine';
import * as THREE from 'three';

interface SimulationCanvasProps {
    state: SimulationState;
}

// --- Procedural Plant Components ---

const WheatRicePlant: React.FC<{ type: 'WHEAT' | 'RICE'; stage: string; health: number }> = ({ type, stage, health: _health }) => {
    const isHarvest = stage === 'HARVEST';
    const color = type === 'WHEAT'
        ? (isHarvest ? '#eab308' : '#84cc16')
        : (isHarvest ? '#fbbf24' : '#65a30d');

    // Blade count increases with stage
    const bladeCount = stage === 'SEEDLING' ? 3 : 8;

    return (
        <group>
            {[...Array(bladeCount)].map((_, i) => (
                <mesh key={i} position={[Math.sin(i) * 0.1, 0.4 + i * 0.05, Math.cos(i) * 0.1]} rotation={[0.2, i, 0]}>
                    <cylinderGeometry args={[0.01, 0.02, 1 + Math.random() * 0.5]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            ))}
            {(stage === 'FLOWERING' || stage === 'HARVEST') && (
                <mesh position={[0, 1.2, 0]}>
                    <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
                    <meshStandardMaterial color={isHarvest ? (type === 'WHEAT' ? '#facc15' : '#fcd34d') : '#a3e635'} />
                </mesh>
            )}
        </group>
    );
};

const StalkPlant: React.FC<{ type: 'MAIZE' | 'SUGARCANE'; stage: string }> = ({ type, stage }) => {
    const isHarvest = stage === 'HARVEST';
    const stalkColor = isHarvest ? '#fef08a' : '#4ade80';
    const leaves = stage === 'SEEDLING' ? 2 : 6;

    return (
        <group>
            {/* Main Stalk */}
            <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 2.5]} />
                <meshStandardMaterial color={stalkColor} />
            </mesh>

            {/* Broad Leaves */}
            {[...Array(leaves)].map((_, i) => (
                <mesh key={i} position={[0, 0.5 + i * 0.3, 0]} rotation={[0.5, i * 2, 0]}>
                    <boxGeometry args={[0.8, 0.02, 0.2]} />
                    <meshStandardMaterial color="#22c55e" />
                </mesh>
            ))}

            {/* Fruit/Product */}
            {(stage === 'FLOWERING' || stage === 'HARVEST') && (
                type === 'MAIZE' ? (
                    <mesh position={[0.15, 1.2, 0]} rotation={[0, 0, -0.2]}>
                        <capsuleGeometry args={[0.12, 0.5]} />
                        <meshStandardMaterial color={isHarvest ? '#fbbf24' : '#fde047'} />  {/* Corn Yellow */}
                    </mesh>
                ) : ( // Sugarcane Top
                    <mesh position={[0, 2.3, 0]}>
                        <cylinderGeometry args={[0.01, 0.05, 0.8]} />
                        <meshStandardMaterial color="#d4d4d8" />
                    </mesh>
                )
            )}
        </group>
    );
};

const BushPlant: React.FC<{ type: 'COTTON' | 'TOMATO' | 'MUSTARD' | 'POTATO' | 'SOYBEAN'; stage: string }> = ({ type, stage }) => {
    const isHarvest = stage === 'HARVEST';

    // Fruit/Flower Logic
    const renderFruits = () => {
        if (stage !== 'FLOWERING' && stage !== 'HARVEST') return null;
        const count = 5;
        return [...Array(count)].map((_, i) => {
            const pos = new THREE.Vector3(Math.sin(i) * 0.4, 0.8 + (i % 2) * 0.3, Math.cos(i) * 0.4);

            if (type === 'COTTON') {
                return (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.12]} />
                        <meshStandardMaterial color={isHarvest ? '#ffffff' : '#fbcfe8'} /> {/* White Cotton / Pink Flower */}
                    </mesh>
                );
            }
            if (type === 'TOMATO') {
                return (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.1]} />
                        <meshStandardMaterial color={isHarvest ? '#ef4444' : '#fef08a'} /> {/* Red Fruit / Yellow Flower */}
                    </mesh>
                );
            }
            if (type === 'MUSTARD') {
                return (
                    <mesh key={i} position={pos}>
                        <sphereGeometry args={[0.08]} />
                        <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.5} /> {/* Yellow Flowers */}
                    </mesh>
                );
            }
            if (type === 'POTATO') {
                return null; // Potatoes are underground!
            }
            if (type === 'SOYBEAN') {
                return (
                    <mesh key={i} position={pos}>
                        <capsuleGeometry args={[0.05, 0.2]} />
                        <meshStandardMaterial color={isHarvest ? '#a16207' : '#84cc16'} /> {/* Brown Pods / Green Pods */}
                    </mesh>
                );
            }
        });
    };

    return (
        <group>
            {/* Bushy Base */}
            <mesh position={[0, 0.6, 0]}>
                <dodecahedronGeometry args={[0.6]} />
                <meshStandardMaterial color="#15803d" />
            </mesh>
            {renderFruits()}
        </group>
    );
};

// --- Main Plant Container ---

const Plant: React.FC<{ state: SimulationState }> = ({ state }) => {
    const group = useRef<THREE.Group>(null);
    const { stage, cropType, health } = state;

    useFrame((state) => {
        if (group.current) {
            // Gentle wind sway
            group.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.05;
        }
    });

    // Visual for SEED stage (Mound of earth)
    if (stage === 'SEED') {
        return (
            <group position={[0, 0.05, 0]}>
                <mesh>
                    <sphereGeometry args={[0.2, 16, 8]} />
                    <meshStandardMaterial color="#3f2e05" />
                </mesh>
            </group>
        );
    }

    if (stage === 'DEAD') return null;

    // Calculate smooth growth
    const duration = CROP_DATA[cropType].duration;
    // Cap progress at 1.0 (100%)
    const growthProgress = Math.min(1, Math.max(0.1, state.day / duration));

    // Smooth scale: Starts at 0.2 (seedling) -> Grows to 1.0 (harvest)
    // Add a tiny bit of random variation per plant instance if we had multiples, but here just one.
    const smoothScale = 0.2 + (growthProgress * 0.8);

    return (
        <group ref={group} scale={[smoothScale, smoothScale, smoothScale]}>
            {/* Roots/Base */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.1, 0.3, 16]} />
                <meshStandardMaterial color="#3f2e05" opacity={0.5} transparent />
            </mesh>

            {/* Categorized Rendering */}
            {(cropType === 'WHEAT' || cropType === 'RICE') && <WheatRicePlant type={cropType} stage={stage} health={health} />}
            {(cropType === 'MAIZE' || cropType === 'SUGARCANE') && <StalkPlant type={cropType} stage={stage} />}
            {['COTTON', 'TOMATO', 'MUSTARD', 'POTATO', 'SOYBEAN'].includes(cropType) && <BushPlant type={cropType as any} stage={stage} />} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </group>
    );
};

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ state }) => {
    return (
        <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-inner bg-gradient-to-b from-sky-200 to-emerald-100 relative">
            <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur rounded-lg p-3 text-xs font-mono shadow-sm">
                <div>Day: {state.day}</div>
                <div>Stage: {state.stage}</div>
                <div>Weather: {state.weather}</div>
            </div>

            <Canvas shadows camera={{ position: [3, 2, 3], fov: 60 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                <Sky sunPosition={state.weather === 'SUNNY' ? [10, 10, 10] : [0, 1, 0]} turbidity={state.weather === 'STORM' ? 10 : 0} />

                {state.weather === 'RAIN' && (
                    <mesh position={[0, 5, 0]}>
                        <cylinderGeometry args={[5, 5, 10, 8]} />
                        <meshStandardMaterial color="#88aaff" transparent opacity={0.2} wireframe />
                    </mesh>
                )}

                <group position={[0, -1, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[20, 20]} />
                        <meshStandardMaterial color={state.waterLevel < 20 ? "#d2b48c" : "#5d4037"} />
                    </mesh>

                    <Plant state={state} />
                    <ContactShadows resolution={512} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />
                </group>

                <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2} minDistance={2} maxDistance={6} />
            </Canvas>
        </div>
    );
};
