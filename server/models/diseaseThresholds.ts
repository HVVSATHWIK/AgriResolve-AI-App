/**
 * Disease Threshold Configuration
 * 
 * Defines crop-specific and disease-specific thresholds for risk assessment
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

/**
 * Crop types supported by the system
 */
export enum CropType {
  TOMATO = 'tomato',
  POTATO = 'potato',
  WHEAT = 'wheat',
  CORN = 'corn',
  SOYBEAN = 'soybean',
  GRAPE = 'grape',
  APPLE = 'apple'
}

/**
 * Disease threshold configuration
 * Each disease has:
 * - crops: Array of crops susceptible to this disease
 * - tempMin: Minimum temperature (°C) for disease development
 * - tempMax: Maximum temperature (°C) for disease development
 * - minWetnessHours: Minimum leaf wetness hours required for infection
 * - optimalTemp: Optimal temperature (°C) for disease development
 */
export interface DiseaseThreshold {
  crops: CropType[];
  tempMin: number;
  tempMax: number;
  minWetnessHours: number;
  optimalTemp: number;
}

/**
 * Disease names
 */
export enum DiseaseName {
  LATE_BLIGHT = 'lateBlight',
  POWDERY_MILDEW = 'powderyMildew',
  RUST = 'rust',
  EARLY_BLIGHT = 'earlyBlight',
  SEPTORIA_LEAF_SPOT = 'septoriaLeafSpot',
  ANTHRACNOSE = 'anthracnose',
  DOWNY_MILDEW = 'downyMildew',
  FUSARIUM_WILT = 'fusariumWilt',
  GRAY_LEAF_SPOT = 'grayLeafSpot',
  NORTHERN_CORN_LEAF_BLIGHT = 'northernCornLeafBlight',
  SOUTHERN_CORN_LEAF_BLIGHT = 'southernCornLeafBlight',
  COMMON_RUST_CORN = 'commonRustCorn',
  FROGEYE_LEAF_SPOT = 'frogeyeLeafSpot',
  BROWN_SPOT = 'brownSpot',
  BACTERIAL_BLIGHT = 'bacterialBlight',
  BLACK_ROT = 'blackRot',
  BOTRYTIS_BUNCH_ROT = 'botrytisBunchRot',
  APPLE_SCAB = 'appleScab',
  FIRE_BLIGHT = 'fireBlight',
  CEDAR_APPLE_RUST = 'cedarAppleRust'
}

/**
 * DISEASE_THRESHOLDS constant with crop-disease mappings
 * 
 * Requirements:
 * - 1.1: Use crop-specific temperature thresholds for each disease type
 * - 1.2: Use disease-specific leaf wetness duration thresholds
 * - 1.3: Late blight: 10-25°C, minimum 10 hours leaf wetness
 * - 1.4: Powdery mildew: 15-30°C, minimum 6 hours leaf wetness
 * - 1.5: Rust disease: 15-25°C, minimum 8 hours leaf wetness
 */
export const DISEASE_THRESHOLDS: Record<DiseaseName, DiseaseThreshold> = {
  // Requirement 1.3: Late blight (Phytophthora infestans)
  // Affects: Potato, Tomato
  // Temperature range: 10-25°C, Optimal: 18°C
  // Minimum wetness: 10 hours
  [DiseaseName.LATE_BLIGHT]: {
    crops: [CropType.POTATO, CropType.TOMATO],
    tempMin: 10,
    tempMax: 25,
    minWetnessHours: 10,
    optimalTemp: 18
  },

  // Requirement 1.4: Powdery mildew (various species)
  // Affects: Grape, Wheat, Tomato
  // Temperature range: 15-30°C, Optimal: 22°C
  // Minimum wetness: 6 hours
  [DiseaseName.POWDERY_MILDEW]: {
    crops: [CropType.GRAPE, CropType.WHEAT, CropType.TOMATO],
    tempMin: 15,
    tempMax: 30,
    minWetnessHours: 6,
    optimalTemp: 22
  },

  // Requirement 1.5: Rust (various species)
  // Affects: Wheat, Corn, Soybean
  // Temperature range: 15-25°C, Optimal: 20°C
  // Minimum wetness: 8 hours
  [DiseaseName.RUST]: {
    crops: [CropType.WHEAT, CropType.CORN, CropType.SOYBEAN],
    tempMin: 15,
    tempMax: 25,
    minWetnessHours: 8,
    optimalTemp: 20
  },

  // Early blight (Alternaria solani)
  // Affects: Potato, Tomato
  // Temperature range: 24-29°C, Optimal: 26°C
  // Minimum wetness: 12 hours
  [DiseaseName.EARLY_BLIGHT]: {
    crops: [CropType.POTATO, CropType.TOMATO],
    tempMin: 24,
    tempMax: 29,
    minWetnessHours: 12,
    optimalTemp: 26
  },

  // Septoria leaf spot (Septoria lycopersici)
  // Affects: Tomato
  // Temperature range: 15-27°C, Optimal: 21°C
  // Minimum wetness: 48 hours
  [DiseaseName.SEPTORIA_LEAF_SPOT]: {
    crops: [CropType.TOMATO],
    tempMin: 15,
    tempMax: 27,
    minWetnessHours: 48,
    optimalTemp: 21
  },

  // Anthracnose (Colletotrichum spp.)
  // Affects: Tomato, Soybean
  // Temperature range: 22-27°C, Optimal: 24°C
  // Minimum wetness: 12 hours
  [DiseaseName.ANTHRACNOSE]: {
    crops: [CropType.TOMATO, CropType.SOYBEAN],
    tempMin: 22,
    tempMax: 27,
    minWetnessHours: 12,
    optimalTemp: 24
  },

  // Downy mildew (various species)
  // Affects: Grape, Soybean
  // Temperature range: 10-25°C, Optimal: 18°C
  // Minimum wetness: 6 hours
  [DiseaseName.DOWNY_MILDEW]: {
    crops: [CropType.GRAPE, CropType.SOYBEAN],
    tempMin: 10,
    tempMax: 25,
    minWetnessHours: 6,
    optimalTemp: 18
  },

  // Fusarium wilt (Fusarium oxysporum)
  // Affects: Tomato
  // Temperature range: 25-32°C, Optimal: 28°C
  // Minimum wetness: 0 hours (soil-borne, not wetness-dependent)
  [DiseaseName.FUSARIUM_WILT]: {
    crops: [CropType.TOMATO],
    tempMin: 25,
    tempMax: 32,
    minWetnessHours: 0,
    optimalTemp: 28
  },

  // Gray leaf spot (Cercospora zeae-maydis)
  // Affects: Corn
  // Temperature range: 22-30°C, Optimal: 26°C
  // Minimum wetness: 12 hours
  [DiseaseName.GRAY_LEAF_SPOT]: {
    crops: [CropType.CORN],
    tempMin: 22,
    tempMax: 30,
    minWetnessHours: 12,
    optimalTemp: 26
  },

  // Northern corn leaf blight (Exserohilum turcicum)
  // Affects: Corn
  // Temperature range: 18-27°C, Optimal: 22°C
  // Minimum wetness: 6 hours
  [DiseaseName.NORTHERN_CORN_LEAF_BLIGHT]: {
    crops: [CropType.CORN],
    tempMin: 18,
    tempMax: 27,
    minWetnessHours: 6,
    optimalTemp: 22
  },

  // Southern corn leaf blight (Bipolaris maydis)
  // Affects: Corn
  // Temperature range: 20-32°C, Optimal: 26°C
  // Minimum wetness: 10 hours
  [DiseaseName.SOUTHERN_CORN_LEAF_BLIGHT]: {
    crops: [CropType.CORN],
    tempMin: 20,
    tempMax: 32,
    minWetnessHours: 10,
    optimalTemp: 26
  },

  // Common rust - Corn (Puccinia sorghi)
  // Affects: Corn
  // Temperature range: 16-23°C, Optimal: 20°C
  // Minimum wetness: 6 hours
  [DiseaseName.COMMON_RUST_CORN]: {
    crops: [CropType.CORN],
    tempMin: 16,
    tempMax: 23,
    minWetnessHours: 6,
    optimalTemp: 20
  },

  // Frogeye leaf spot (Cercospora sojina)
  // Affects: Soybean
  // Temperature range: 22-30°C, Optimal: 26°C
  // Minimum wetness: 12 hours
  [DiseaseName.FROGEYE_LEAF_SPOT]: {
    crops: [CropType.SOYBEAN],
    tempMin: 22,
    tempMax: 30,
    minWetnessHours: 12,
    optimalTemp: 26
  },

  // Brown spot (Septoria glycines)
  // Affects: Soybean
  // Temperature range: 20-28°C, Optimal: 24°C
  // Minimum wetness: 24 hours
  [DiseaseName.BROWN_SPOT]: {
    crops: [CropType.SOYBEAN],
    tempMin: 20,
    tempMax: 28,
    minWetnessHours: 24,
    optimalTemp: 24
  },

  // Bacterial blight (Pseudomonas syringae)
  // Affects: Soybean, Wheat
  // Temperature range: 24-28°C, Optimal: 26°C
  // Minimum wetness: 2 hours
  [DiseaseName.BACTERIAL_BLIGHT]: {
    crops: [CropType.SOYBEAN, CropType.WHEAT],
    tempMin: 24,
    tempMax: 28,
    minWetnessHours: 2,
    optimalTemp: 26
  },

  // Black rot (Guignardia bidwellii)
  // Affects: Grape
  // Temperature range: 9-32°C, Optimal: 26°C
  // Minimum wetness: 8 hours
  [DiseaseName.BLACK_ROT]: {
    crops: [CropType.GRAPE],
    tempMin: 9,
    tempMax: 32,
    minWetnessHours: 8,
    optimalTemp: 26
  },

  // Botrytis bunch rot (Botrytis cinerea)
  // Affects: Grape
  // Temperature range: 15-25°C, Optimal: 20°C
  // Minimum wetness: 15 hours
  [DiseaseName.BOTRYTIS_BUNCH_ROT]: {
    crops: [CropType.GRAPE],
    tempMin: 15,
    tempMax: 25,
    minWetnessHours: 15,
    optimalTemp: 20
  },

  // Apple scab (Venturia inaequalis)
  // Affects: Apple
  // Temperature range: 6-25°C, Optimal: 18°C
  // Minimum wetness: 9 hours
  [DiseaseName.APPLE_SCAB]: {
    crops: [CropType.APPLE],
    tempMin: 6,
    tempMax: 25,
    minWetnessHours: 9,
    optimalTemp: 18
  },

  // Fire blight (Erwinia amylovora)
  // Affects: Apple
  // Temperature range: 18-30°C, Optimal: 24°C
  // Minimum wetness: 2 hours
  [DiseaseName.FIRE_BLIGHT]: {
    crops: [CropType.APPLE],
    tempMin: 18,
    tempMax: 30,
    minWetnessHours: 2,
    optimalTemp: 24
  },

  // Cedar apple rust (Gymnosporangium juniperi-virginianae)
  // Affects: Apple
  // Temperature range: 8-24°C, Optimal: 18°C
  // Minimum wetness: 4 hours
  [DiseaseName.CEDAR_APPLE_RUST]: {
    crops: [CropType.APPLE],
    tempMin: 8,
    tempMax: 24,
    minWetnessHours: 4,
    optimalTemp: 18
  }
};

/**
 * Get diseases relevant to a specific crop type
 * Requirement 1.7: Filter diseases by crop type relevance
 * 
 * @param cropType - The crop type to filter diseases for
 * @returns Array of disease names relevant to the crop
 */
export function getDiseasesForCrop(cropType: CropType): DiseaseName[] {
  const diseases: DiseaseName[] = [];
  
  for (const [diseaseName, threshold] of Object.entries(DISEASE_THRESHOLDS)) {
    if (threshold.crops.includes(cropType)) {
      diseases.push(diseaseName as DiseaseName);
    }
  }
  
  return diseases;
}

/**
 * Get threshold configuration for a specific disease
 * 
 * @param diseaseName - The disease name
 * @returns Disease threshold configuration or undefined
 */
export function getDiseaseThreshold(diseaseName: DiseaseName): DiseaseThreshold | undefined {
  return DISEASE_THRESHOLDS[diseaseName];
}

/**
 * Check if a disease affects a specific crop
 * 
 * @param diseaseName - The disease name
 * @param cropType - The crop type
 * @returns True if the disease affects the crop, false otherwise
 */
export function isDiseaseRelevantToCrop(diseaseName: DiseaseName, cropType: CropType): boolean {
  const threshold = DISEASE_THRESHOLDS[diseaseName];
  return threshold ? threshold.crops.includes(cropType) : false;
}

/**
 * Get all supported crop types
 * 
 * @returns Array of all crop types
 */
export function getAllCropTypes(): CropType[] {
  return Object.values(CropType);
}

/**
 * Get all disease names
 * 
 * @returns Array of all disease names
 */
export function getAllDiseaseNames(): DiseaseName[] {
  return Object.values(DiseaseName);
}

/**
 * Get human-readable disease name
 * 
 * @param diseaseName - The disease name enum value
 * @returns Human-readable disease name
 */
export function getHumanReadableDiseaseName(diseaseName: DiseaseName): string {
  const nameMap: Record<DiseaseName, string> = {
    [DiseaseName.LATE_BLIGHT]: 'Late Blight',
    [DiseaseName.POWDERY_MILDEW]: 'Powdery Mildew',
    [DiseaseName.RUST]: 'Rust',
    [DiseaseName.EARLY_BLIGHT]: 'Early Blight',
    [DiseaseName.SEPTORIA_LEAF_SPOT]: 'Septoria Leaf Spot',
    [DiseaseName.ANTHRACNOSE]: 'Anthracnose',
    [DiseaseName.DOWNY_MILDEW]: 'Downy Mildew',
    [DiseaseName.FUSARIUM_WILT]: 'Fusarium Wilt',
    [DiseaseName.GRAY_LEAF_SPOT]: 'Gray Leaf Spot',
    [DiseaseName.NORTHERN_CORN_LEAF_BLIGHT]: 'Northern Corn Leaf Blight',
    [DiseaseName.SOUTHERN_CORN_LEAF_BLIGHT]: 'Southern Corn Leaf Blight',
    [DiseaseName.COMMON_RUST_CORN]: 'Common Rust (Corn)',
    [DiseaseName.FROGEYE_LEAF_SPOT]: 'Frogeye Leaf Spot',
    [DiseaseName.BROWN_SPOT]: 'Brown Spot',
    [DiseaseName.BACTERIAL_BLIGHT]: 'Bacterial Blight',
    [DiseaseName.BLACK_ROT]: 'Black Rot',
    [DiseaseName.BOTRYTIS_BUNCH_ROT]: 'Botrytis Bunch Rot',
    [DiseaseName.APPLE_SCAB]: 'Apple Scab',
    [DiseaseName.FIRE_BLIGHT]: 'Fire Blight',
    [DiseaseName.CEDAR_APPLE_RUST]: 'Cedar Apple Rust'
  };
  
  return nameMap[diseaseName] || diseaseName;
}

/**
 * Get human-readable crop name
 * 
 * @param cropType - The crop type enum value
 * @returns Human-readable crop name
 */
export function getHumanReadableCropName(cropType: CropType): string {
  const nameMap: Record<CropType, string> = {
    [CropType.TOMATO]: 'Tomato',
    [CropType.POTATO]: 'Potato',
    [CropType.WHEAT]: 'Wheat',
    [CropType.CORN]: 'Corn',
    [CropType.SOYBEAN]: 'Soybean',
    [CropType.GRAPE]: 'Grape',
    [CropType.APPLE]: 'Apple'
  };
  
  return nameMap[cropType] || cropType;
}
