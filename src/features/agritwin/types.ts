// Agri-Twin Data Layer
// Based on Indian Soil Health Card (SHC) & STCR Standards

export type SoilType = 'RED' | 'BLACK' | 'ALLUVIAL' | 'LATERITE';
export type CropType = 'RICE' | 'WHEAT' | 'COTTON' | 'MAIZE' | 'CHILLI';

// 1. Soil Health Card (SHC) Schema
export interface SoilHealthCard {
    id: string;
    // Macro Nutrients
    N: number; // Nitrogen (kg/ha)
    P: number; // Phosphorus (kg/ha)
    K: number; // Potassium (kg/ha)
    // Secondary
    S?: number; // Sulphur (ppm)
    // Micro
    Zn?: number; // Zinc (ppm)
    Fe?: number; // Iron (ppm)
    Cu?: number; // Copper (ppm)
    Mn?: number; // Manganese (ppm)
    B?: number; // Boron (ppm)
    // Physical
    pH: number;
    EC: number; // Electrical Conductivity (dS/m)
    OC: number; // Organic Carbon (%)
}

// 2. Simulation State (The "Cyber" Twin)
export interface SimulationState {
    day: number;
    date: string; // ISO Date "2024-06-15"

    // Physical Assets
    crop: {
        type: CropType;
        name: string;
        variety: string;
        dvs: number; // 0.0 to 2.0 (Development Stage)
        biomass: number; // kg/ha (Total living)
        biomass_leaf: number;
        biomass_stem: number;
        biomass_storage: number; // Grain/Fruit (Yield)
        biomass_root: number;
        lai: number; // Leaf Area Index
        height: number; // cm
        roots: number; // Root depth (cm)
        health: number; // 0-100%
        weed_density: number; // 0.0 (none) to 1.0 (overrun)
    };

    soil: {
        moisture: number; // % Field Capacity
        n_pool: number; // kg/ha available
        p_pool: number;
        k_pool: number;
    };

    weather: {
        temp_max: number;
        temp_min: number;
        rain: number; // mm
        radiation: number; // MJ/m2
    };

    // Analytics
    stress: {
        water: number; // 0 (no stress) to 1 (severe)
        nitrogen: number;
        heat: number;
    };

    yield_forecast: number; // kg/ha
    event_log: string[];
}

// 3. Configuration Constants (Knowledge Base)
export const CROP_LIBRARY: Record<CropType, {
    name: string;
    duration_days: number;
    max_lai: number;
    water_need_mm: number;
    base_temp: number;
    potential_yield: number; // kg/ha
    stcr_equations: {
        FN: (T: number, SN: number) => number; // Target Yield, Soil N -> Fert N
        FP: (T: number, SP: number) => number;
        FK: (T: number, SK: number) => number;
    }
}> = {
    RICE: {
        name: "Rice (Paddy)",
        duration_days: 120,
        max_lai: 6.0,
        water_need_mm: 1200,
        base_temp: 10,
        potential_yield: 8500,
        stcr_equations: {
            FN: (T, SN) => 4.25 * T - 0.45 * SN,
            FP: (T, SP) => 3.55 * T - 4.89 * SP,
            FK: (T, SK) => 2.10 * T - 0.18 * SK
        }
    },
    COTTON: {
        name: "Cotton (Bt)",
        duration_days: 150,
        max_lai: 4.5,
        water_need_mm: 700,
        base_temp: 15,
        potential_yield: 4000,
        stcr_equations: {
            FN: (T, SN) => 8.15 * T - 0.57 * SN,
            FP: (T, SP) => 2.95 * T - 2.80 * SP,
            FK: (T, SK) => 5.92 * T - 0.66 * SK
        }
    },
    WHEAT: {
        name: "Wheat",
        duration_days: 110,
        max_lai: 5.0,
        water_need_mm: 450,
        base_temp: 5,
        potential_yield: 6000,
        stcr_equations: {
            FN: (T, SN) => 4.4 * T - 0.40 * SN,
            FP: (T, SP) => 3.8 * T - 3.20 * SP,
            FK: (T, SK) => 2.5 * T - 0.20 * SK
        }
    },
    MAIZE: {
        name: "Maize",
        duration_days: 100,
        max_lai: 5.5,
        water_need_mm: 500,
        base_temp: 10,
        potential_yield: 9000,
        stcr_equations: {
            FN: (T, SN) => 3.6 * T - 0.35 * SN,
            FP: (T, SP) => 2.8 * T - 2.10 * SP,
            FK: (T, SK) => 1.9 * T - 0.25 * SK
        }
    },
    CHILLI: {
        name: "Chilli",
        duration_days: 160,
        max_lai: 3.5,
        water_need_mm: 600,
        base_temp: 18,
        potential_yield: 3500,
        stcr_equations: {
            FN: (T, SN) => 7.2 * T - 0.50 * SN,
            FP: (T, SP) => 3.1 * T - 2.40 * SP,
            FK: (T, SK) => 5.2 * T - 0.55 * SK
        }
    }
};
