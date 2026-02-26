export type SoilType = 'SANDY' | 'LOAMY' | 'CLAY';
export type RegionType = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
export type CropType = 'WHEAT' | 'RICE' | 'COTTON' | 'SUGARCANE' | 'TOMATO' | 'MAIZE' | 'MUSTARD' | 'POTATO' | 'SOYBEAN';
export type WeatherType = 'SUNNY' | 'RAIN' | 'DROUGHT' | 'STORM';

export interface SimulationState {
    day: number;
    health: number; // 0-100
    stage: 'SEED' | 'SEEDLING' | 'VEGETATIVE' | 'FLOWERING' | 'HARVEST' | 'DEAD';
    waterLevel: number; // 0-100
    nitrogenLevel: number; // 0-100
    pestLevel: number; // 0-100 (0 is good)
    weather: WeatherType;
    funds: number;

    // Configuration
    region: RegionType;
    soilType: SoilType;
    cropType: CropType;

    // Status
    activeEvents: string[];
    log: string[];
    yieldGrade?: 'A+' | 'A' | 'B' | 'C' | 'D';
    weedLevel: number; // 0-100
}

export type ActionType = 'WATER' | 'FERTILIZE' | 'PESTICIDE' | 'HARVEST' | 'NEXT_DAY' | 'DEWEED';

// Knowledge Base
export const REGION_DATA: Record<RegionType, { name: string, weatherBias: string, crops: CropType[] }> = {
    NORTH: { name: 'North India', weatherBias: 'EXTREME', crops: ['WHEAT', 'SUGARCANE', 'MUSTARD', 'MAIZE', 'POTATO'] },
    SOUTH: { name: 'South India', weatherBias: 'HUMID', crops: ['RICE', 'COTTON', 'TOMATO', 'SOYBEAN'] },
    EAST: { name: 'East India', weatherBias: 'RAINY', crops: ['RICE', 'TOMATO', 'POTATO', 'MAIZE'] },
    WEST: { name: 'West India', weatherBias: 'DRY', crops: ['COTTON', 'WHEAT', 'SOYBEAN', 'MUSTARD'] }
};

export const CROP_DATA: Record<CropType, { name: string, waterNeed: number, pestRisk: number, duration: number }> = {
    WHEAT: { name: 'Wheat', waterNeed: 1.0, pestRisk: 0.3, duration: 45 },
    RICE: { name: 'Rice', waterNeed: 2.0, pestRisk: 0.5, duration: 50 },
    COTTON: { name: 'Cotton', waterNeed: 1.2, pestRisk: 0.8, duration: 60 },
    SUGARCANE: { name: 'Sugarcane', waterNeed: 1.8, pestRisk: 0.4, duration: 55 },
    TOMATO: { name: 'Tomato', waterNeed: 1.5, pestRisk: 0.7, duration: 40 },
    MAIZE: { name: 'Maize (Corn)', waterNeed: 1.4, pestRisk: 0.6, duration: 45 },
    MUSTARD: { name: 'Mustard (Sarson)', waterNeed: 0.8, pestRisk: 0.4, duration: 40 },
    POTATO: { name: 'Potato', waterNeed: 1.2, pestRisk: 0.5, duration: 35 },
    SOYBEAN: { name: 'Soybean', waterNeed: 1.3, pestRisk: 0.6, duration: 50 }
};

const SOIL_PROPERTIES = {
    SANDY: { drainage: 25, nutrientLeak: 5, retention: 0.5 },
    LOAMY: { drainage: 10, nutrientLeak: 2, retention: 1.0 },
    CLAY: { drainage: 5, nutrientLeak: 1, retention: 1.5 }
};

export class SimulationEngine {
    state: SimulationState;

    constructor(region: RegionType = 'NORTH', soil: SoilType = 'LOAMY', crop: CropType = 'WHEAT') {
        this.state = {
            day: 1,
            health: 100,
            stage: 'SEED',
            waterLevel: 50,
            nitrogenLevel: 50,
            pestLevel: 0,
            weedLevel: 0,
            weather: 'SUNNY',
            funds: 1000,

            region,
            soilType: soil,
            cropType: crop,

            activeEvents: [],
            log: [`Started in ${REGION_DATA[region].name}. Planted ${CROP_DATA[crop].name}.`]
        };
    }

    getState(): SimulationState {
        return { ...this.state };
    }

    performAction(action: ActionType): SimulationState {
        if (this.state.stage === 'DEAD' && action !== 'NEXT_DAY') return this.state;

        switch (action) {
            case 'WATER': this.water(); break;
            case 'FERTILIZE': this.fertilize(); break;
            case 'PESTICIDE': this.applyPesticide(); break;
            case 'DEWEED': this.deweed(); break;
            case 'HARVEST': this.harvest(); break;
            case 'NEXT_DAY': this.advanceDay(); break;
        }
        return this.getState();
    }

    private water() {
        if (this.state.funds < 10) {
            this.log('Not enough funds to water! (Need 10)');
            return;
        }
        this.state.funds -= 10;
        this.state.waterLevel = Math.min(100, this.state.waterLevel + 30);
        this.log('Watered crop (-10 coins, +30 hydration).');
    }

    private fertilize() {
        if (this.state.funds < 50) {
            this.log('Not enough funds to fertilize! (Need 50)');
            return;
        }
        const soil = this.state.soilType;
        const efficiency = soil === 'CLAY' ? 50 : (soil === 'SANDY' ? 30 : 40);
        this.state.nitrogenLevel = Math.min(100, this.state.nitrogenLevel + efficiency);
        this.state.funds -= 50;
        this.log(`Applied fertilizer (-50 coins, +${efficiency} nitrogen).`);
    }

    private applyPesticide() {
        if (this.state.funds < 100) {
            this.log('Not enough funds for pesticide! (Need 100)');
            return;
        }
        this.state.funds -= 100;
        this.state.pestLevel = Math.max(0, this.state.pestLevel - 50);
        this.log('Sprayed pesticide (-100 coins, reduced pests).');
    }

    private deweed() {
        this.state.weedLevel = Math.max(0, this.state.weedLevel - 50);
        this.log('Removed weeds. Crop can breathe now!');
    }

    private harvest() {
        if (this.state.stage === 'HARVEST') {
            const score = this.state.health;
            let grade: 'A+' | 'A' | 'B' | 'C' | 'D';

            if (score >= 90) grade = 'A+';
            else if (score >= 80) grade = 'A';
            else if (score >= 60) grade = 'B';
            else if (score >= 40) grade = 'C';
            else grade = 'D';

            this.state.yieldGrade = grade;
            this.log(`Harvested! Crop Quality: ${grade} (${Math.floor(score)}/100).`);

            // Soft reset ? No, let them see result. They can restart via UI.
            this.state.stage = 'DEAD'; // Visual stop
        } else {
            this.log('Not ready to harvest yet!');
        }
    }

    private advanceDay() {
        this.state.day += 1;
        this.state.activeEvents = [];

        // 1. Weather Logic based on Region
        this.determineWeather();

        // 2. Events (Non-financial)
        if (Math.random() < 0.05) {
            const eventRoll = Math.random();
            if (eventRoll < 0.5) {
                this.state.activeEvents.push("Locust Attack");
                this.state.health -= 20;
                this.state.pestLevel += 40;
                this.log("⚠️ LOCUST ATTACK! Crop damaged.");
            } else {
                this.state.activeEvents.push("Heavy Wind");
                this.state.health -= 5;
                this.log("⚠️ HEAVY WIND! minor damage.");
            }
        }

        // 3. Soil, Plant & Weed Physics
        const crop = CROP_DATA[this.state.cropType];
        const props = SOIL_PROPERTIES[this.state.soilType];

        // Weed Growth
        let weedGrowth = 5;
        if (this.state.weather === 'RAIN') weedGrowth += 5;
        if (this.state.nitrogenLevel > 60) weedGrowth += 2; // Weeds love fertilizer too!
        this.state.weedLevel = Math.min(100, this.state.weedLevel + weedGrowth);

        // Resource Drain from weeds
        const weedDrain = this.state.weedLevel * 0.1;

        let waterChange = -props.drainage * crop.waterNeed - weedDrain;

        if (this.state.weather === 'SUNNY') waterChange -= 5;
        if (this.state.weather === 'RAIN') waterChange += (20 * props.retention);
        if (this.state.weather === 'DROUGHT') waterChange -= 15;
        if (this.state.weather === 'STORM') waterChange += 30; // Excess water risk

        this.state.waterLevel = Math.max(0, Math.min(100, this.state.waterLevel + waterChange));

        const nutrientLoss = props.nutrientLeak + weedDrain;
        this.state.nitrogenLevel = Math.max(0, Math.min(100, this.state.nitrogenLevel - nutrientLoss));

        if (Math.random() > 0.6) {
            this.state.pestLevel += 5 * crop.pestRisk;
        }

        if (this.state.weedLevel > 50 && Math.random() < 0.3) {
            this.log("Weeds are choking the crop! De-weed needed.");
        }

        this.calculateHealth();
        this.advanceStage(crop.duration);

        this.log(`Day ${this.state.day}: ${this.state.weather}. Health: ${Math.floor(this.state.health)}%`);
    }

    private determineWeather() {
        // Simplified weather bias
        const bias = REGION_DATA[this.state.region].weatherBias;
        const roll = Math.random();

        if (bias === 'RAINY') {
            if (roll < 0.4) this.state.weather = 'RAIN'; // High rain
            else if (roll < 0.7) this.state.weather = 'SUNNY';
            else this.state.weather = 'STORM';
        } else if (bias === 'DRY') {
            if (roll < 0.6) this.state.weather = 'SUNNY';
            else if (roll < 0.8) this.state.weather = 'DROUGHT';
            else this.state.weather = 'RAIN';
        } else if (bias === 'HUMID') {
            if (roll < 0.5) this.state.weather = 'SUNNY';
            else this.state.weather = 'RAIN';
        } else { // EXTREME (North)
            if (roll < 0.3) this.state.weather = 'SUNNY'; // Balanced
            else if (roll < 0.6) this.state.weather = 'RAIN';
            else if (roll < 0.8) this.state.weather = 'DROUGHT';
            else this.state.weather = 'STORM';
        }
    }

    private calculateHealth() {
        let healthChange = 0;
        // Water stress
        if (this.state.waterLevel < 20 || this.state.waterLevel > 90) healthChange -= 5;
        // Nutrient stress
        if (this.state.nitrogenLevel < 10) healthChange -= 3;
        // Pest damage
        if (this.state.pestLevel > 40) healthChange -= 5;

        // Recovery if everything is good
        if (this.state.waterLevel >= 40 && this.state.waterLevel <= 70 && this.state.nitrogenLevel > 50 && this.state.pestLevel < 20) {
            healthChange += 2;
        }

        this.state.health = Math.max(0, Math.min(100, this.state.health + healthChange));
    }

    private advanceStage(duration: number) {
        if (this.state.health <= 0) {
            this.state.stage = 'DEAD';
            this.log('Crop died. Try again.');
        } else {
            // Dynamic stages based on duration
            const p = this.state.day / duration;
            if (p > 1.0) this.state.stage = 'HARVEST';
            else if (p > 0.6) this.state.stage = 'FLOWERING';
            else if (p > 0.3) this.state.stage = 'VEGETATIVE';
            else if (p > 0.1) this.state.stage = 'SEEDLING';
        }
    }

    private log(msg: string) {
        this.state.log.unshift(msg);
        if (this.state.log.length > 20) this.state.log.pop();
    }
}
