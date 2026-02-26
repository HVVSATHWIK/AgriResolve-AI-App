import { SimulationState, CROP_LIBRARY, SoilHealthCard, CropType } from './types';

// Simplified WOFOST/AquaCrop Implementation for JS Client
export class AgriTwinEngine {
    state: SimulationState;
    initialSHC: SoilHealthCard;
    targetYield: number; // q/ha

    constructor(shc: SoilHealthCard, cropType: CropType, startDate: string = "2024-06-15") {
        this.initialSHC = shc;
        const cropConfig = CROP_LIBRARY[cropType];

        // Initial State
        this.state = {
            day: 1,
            date: startDate,
            crop: {
                type: cropType,
                name: cropConfig.name,
                variety: "High Yielding",
                dvs: 0.0,
                biomass: 50, // Initial seed mass
                biomass_leaf: 20,
                biomass_stem: 10,
                biomass_root: 20,
                biomass_storage: 0,
                lai: 0.05,
                height: 5,
                roots: 5,
                health: 100,
                weed_density: 0.0
            },
            soil: {
                moisture: 100, // % Field Capacity (assume started wet)
                n_pool: shc.N, // Initial from Soil Test
                p_pool: shc.P,
                k_pool: shc.K
            },
            weather: {
                temp_max: 30,
                temp_min: 22,
                rain: 0,
                radiation: 20
            },
            stress: { water: 0, nitrogen: 0, heat: 0 },
            yield_forecast: 0,
            event_log: ["Simulation Initialized. Seedbed prepared."]
        };

        // Default Target (70% of potential)
        this.targetYield = (cropConfig.potential_yield / 100) * 0.7; // converts kg/ha -> q/ha roughly just for logic
    }

    // Main Loop: Step forward one day
    public nextDay(actions: { irrigate?: number; fertilize_n?: number; weed?: boolean; harvest?: boolean; newCrop?: CropType }): SimulationState {
        this.state.day++;

        // 0. Handle Manual Actions (Weeding / Harvest)
        if (actions.harvest) {
            this.harvest(actions.newCrop || 'RICE');
            return { ...this.state }; // Return immediately after harvest/reset
        }

        if (actions.weed) {
            this.state.crop.weed_density = Math.max(0, this.state.crop.weed_density - 0.8);
            this.log("Manually removed weeds.");
        }

        // 1. Weather Generator (Stochastic for now)
        this.generateWeather();

        // 2. Hydrology (Water Balance)
        this.simulateHydrology(actions.irrigate || 0);

        // 3. Nutrient Balance
        this.simulateNutrients(actions.fertilize_n || 0);

        // 4. Crop Growth (WOFOST Logic)
        this.simulateGrowth();

        // 5. Weed Growth
        this.simulateWeeds();

        return { ...this.state };
    }

    private generateWeather() {
        // Bias weather based on day of year (Simple Sine wave for temp)
        const t_variation = Math.sin(this.state.day / 60) * 5;
        this.state.weather.temp_max = 32 + t_variation + (Math.random() * 2);
        this.state.weather.temp_min = 24 + t_variation - (Math.random() * 2);

        // Rain Event (Probabilistic)
        if (Math.random() < 0.15) {
            this.state.weather.rain = Math.random() * 40; // 0-40mm
            this.state.weather.radiation = 10; // Cloudy
        } else {
            this.state.weather.rain = 0;
            this.state.weather.radiation = 22; // Sunny
        }
    }

    private simulateHydrology(irrigationInput: number) {
        // SIM-003: Clamping inputs
        const irrigation = Math.max(0, Math.min(irrigationInput, 1000)); // Max 1000mm at once

        const ET0 = 5; // Reference Evapotranspiration (mm/day) - approximated
        const Kc = 0.4 + (this.state.crop.lai / 3); // Crop Coefficient increases with canopy
        const ETc = ET0 * Math.min(Kc, 1.2);

        // Water In: Rain + Irrigation
        const waterIn = this.state.weather.rain + irrigation;

        // Water Out: ETc
        const soilBucketChange = waterIn - ETc;

        // Update Soil Moisture
        this.state.soil.moisture += (soilBucketChange / 2); // Simplified Capacity
        this.state.soil.moisture = Math.max(0, Math.min(100, this.state.soil.moisture));

        // Stress Calculation
        if (this.state.soil.moisture < 30) {
            this.state.stress.water = (30 - this.state.soil.moisture) / 30; // 0 to 1
            if (this.state.stress.water > 0.5) this.log("⚠️ Water Stress Detected!");
        } else {
            this.state.stress.water = 0;
        }

        if (irrigation > 0) this.log(`Irrigated ${irrigation}mm.`);
    }

    private simulateNutrients(fertilizerInput: number) {
        // SIM-003: Clamping inputs
        const fertilizer = Math.max(0, Math.min(fertilizerInput, 500)); // Max 500kg N at once

        // Mineralization (Soil releases N slowly)
        const mineralization = 0.5; // kg/ha/day

        // Uptake (Demand driven by growth)
        const uptakeDemand = this.state.crop.lai * 1.5; // kg/ha/day

        // Balance
        this.state.soil.n_pool += (fertilizer + mineralization) - uptakeDemand;
        this.state.soil.n_pool = Math.max(0, this.state.soil.n_pool); // Prevent negative soil N

        // Stress
        if (this.state.soil.n_pool < 20) {
            this.state.stress.nitrogen = (20 - this.state.soil.n_pool) / 20;
            if (this.state.stress.nitrogen > 0.5) this.log("⚠️ Nitrogen Deficiency!");
        } else {
            this.state.stress.nitrogen = 0;
        }

        if (fertilizer > 0) this.log(`Applied ${fertilizer} kg N.`);
    }

    private simulateGrowth() {
        const config = CROP_LIBRARY[this.state.crop.type];

        // --- 1. Phenology (Development Stage) ---
        // DVS Rate depends on Temp (Degree Days)
        const avgTemp = (this.state.weather.temp_max + this.state.weather.temp_min) / 2;
        const dailyHeatUnits = Math.max(0, avgTemp - config.base_temp);
        const totalHeatUnitsNeeded = config.duration_days * 15; // Approx GDD needed
        const dvsRate = dailyHeatUnits / totalHeatUnitsNeeded;

        this.state.crop.dvs += dvsRate;

        // --- 2. Photosynthesis (CO2 Assimilation) ---
        // Radiation Use Efficiency (RUE) approach (g DM / MJ PAR)
        // Simple RUE for C3 (Rice/Wheat) ~ 2.22, C4 (Maize) ~ 3.0
        const RUE = 2.5;
        const PAR = this.state.weather.radiation * 0.5; // Photosynthetically Active Radiation (~50% of global)

        // Light Interception by Canopy (Beer's Law)
        const k = 0.6; // Extinction coefficient
        const fIntercepted = 1 - Math.exp(-k * this.state.crop.lai);

        // Potential Growth
        let dDryMatter = RUE * PAR * fIntercepted * 10; // *10 converts g/m2 to kg/ha

        // Reduction by Stress
        const waterStressFactor = 1 - this.state.stress.water;
        const nStressFactor = 1 - this.state.stress.nitrogen;
        const growthFactor = Math.min(waterStressFactor, nStressFactor);

        dDryMatter *= growthFactor;

        // --- 3. Biomass Partitioning (Function of DVS) ---
        let fRoot = 0, fStem = 0, fLeaf = 0, fStorage = 0;

        if (this.state.crop.dvs < 1.0) {
            // Vegetative Phase
            // Early: Roots & Leaves. Late: Stems.
            fRoot = 0.4 - (0.2 * this.state.crop.dvs); // Decreases 0.4 -> 0.2
            fLeaf = 0.4 - (0.1 * this.state.crop.dvs); // Decreases 0.4 -> 0.3
            fStem = 1 - fRoot - fLeaf;                 // Increases
        } else {
            // Reproductive Phase
            // Mostly Storage (Grain filling)
            fRoot = 0.1;
            fStem = 0.1;
            fLeaf = 0.0;
            fStorage = 0.8;
        }

        // Apply Growth
        this.state.crop.biomass_root += dDryMatter * fRoot;
        this.state.crop.biomass_stem += dDryMatter * fStem;
        this.state.crop.biomass_leaf += dDryMatter * fLeaf;
        this.state.crop.biomass_storage += dDryMatter * fStorage;

        this.state.crop.biomass = this.state.crop.biomass_root + this.state.crop.biomass_stem + this.state.crop.biomass_leaf + this.state.crop.biomass_storage;

        // --- 4. Morphological Development ---
        // LAI Growth (Specific Leaf Area SLA)
        if (this.state.crop.dvs < 1.0 && fLeaf > 0) {
            const SLA = 0.0025; // ha/kg (25 m2/kg)
            const dLai = dDryMatter * fLeaf * SLA;
            this.state.crop.lai += dLai;

            // Senescence due to shading/age (if LAI is high)
            if (this.state.crop.lai > config.max_lai) {
                this.state.crop.lai = config.max_lai;
            }
        } else {
            // Leaf senescence after flowering
            this.state.crop.lai -= 0.01 * this.state.crop.lai;
        }

        // Height (correlated with Stem)
        if (this.state.crop.dvs < 1.2) {
            this.state.crop.height += (dDryMatter * fStem) * 0.05; // Arbitrary scale
        }

        // Yield Forecast Update
        this.state.yield_forecast = this.state.crop.biomass_storage;

        // Health
        this.state.crop.health = 100 * (1 - Math.max(this.state.stress.water, this.state.stress.nitrogen, this.state.stress.heat));
    }

    private simulateWeeds() {
        // Weeds grow faster if there is water and N, but are suppressed by crop canopy (LAI)
        // However, early weeds suppress crop.

        const growthRate = 0.02; // Base daily increase
        const mitigation = this.state.crop.lai * 0.05; // Canopy suppression

        // Net growth
        let delta = growthRate - mitigation;
        if (delta < 0) delta = 0; // Weeds don't die just from shade, they just stop growing (simplified)

        // Add to density
        this.state.crop.weed_density += delta;
        this.state.crop.weed_density = Math.min(1.0, this.state.crop.weed_density);

        // Impact on Resources (Competition)
        if (this.state.crop.weed_density > 0.3) {
            // Steal Nitogen
            this.state.soil.n_pool -= this.state.crop.weed_density * 0.5;
            // Steal Water
            this.state.soil.moisture -= this.state.crop.weed_density * 1.0;
        }
    }

    private harvest(nextCropType: CropType) {
        const cropConfig = CROP_LIBRARY[nextCropType];
        this.state.crop = {
            type: nextCropType,
            name: cropConfig.name,
            variety: "High Yielding",
            dvs: 0.0,
            biomass: 50,
            biomass_leaf: 20,
            biomass_stem: 10,
            biomass_storage: 0,
            biomass_root: 20,
            lai: 0.05,
            height: 5,
            roots: 5,
            health: 100,
            weed_density: 0.1 // Some weeds always remain/return
        };
        this.state.day = 1; // Reset day counter for new season? Or keep accumulating? Let's reset for "Season"
        this.state.yield_forecast = 0;
        this.log(`Harvested! Started new season with ${cropConfig.name}.`);
    }

    private log(msg: string) {
        this.state.event_log.unshift(`Day ${this.state.day}: ${msg}`);
        if (this.state.event_log.length > 10) this.state.event_log.pop();
    }
}
