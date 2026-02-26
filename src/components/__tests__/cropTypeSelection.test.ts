/**
 * Unit Tests for Crop Type Selection Logic
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { CropType, getAllCropTypes, getDiseasesForCrop, isDiseaseRelevantToCrop, DiseaseName } from '../../../server/models/diseaseThresholds';

describe('Crop Type Selection', () => {
  /**
   * Requirement 4.3: System SHALL support crop types including tomato, potato, wheat, corn, soybean, grape, and apple
   */
  test('all supported crop types are available', () => {
    const crops = getAllCropTypes();

    expect(crops).toContain(CropType.TOMATO);
    expect(crops).toContain(CropType.POTATO);
    expect(crops).toContain(CropType.WHEAT);
    expect(crops).toContain(CropType.CORN);
    expect(crops).toContain(CropType.SOYBEAN);
    expect(crops).toContain(CropType.GRAPE);
    expect(crops).toContain(CropType.APPLE);
    expect(crops.length).toBe(7);
  });

  /**
   * Requirement 4.2: When crop type is selected, System SHALL filter disease analysis to include only diseases relevant to that crop
   * Test that selecting tomato filters to tomato-relevant diseases
   */
  test('selecting tomato filters to tomato-relevant diseases', () => {
    const tomatoDiseases = getDiseasesForCrop(CropType.TOMATO);

    // Tomato should have late blight, early blight, powdery mildew, etc.
    expect(tomatoDiseases).toContain(DiseaseName.LATE_BLIGHT);
    expect(tomatoDiseases).toContain(DiseaseName.EARLY_BLIGHT);
    expect(tomatoDiseases).toContain(DiseaseName.POWDERY_MILDEW);

    // Tomato should NOT have apple-specific diseases
    expect(tomatoDiseases).not.toContain(DiseaseName.APPLE_SCAB);
    expect(tomatoDiseases).not.toContain(DiseaseName.FIRE_BLIGHT);
    expect(tomatoDiseases).not.toContain(DiseaseName.CEDAR_APPLE_RUST);
  });

  /**
   * Requirement 4.2: When crop type is selected, System SHALL filter disease analysis to include only diseases relevant to that crop
   * Test that selecting wheat filters to wheat-relevant diseases
   */
  test('selecting wheat filters to wheat-relevant diseases', () => {
    const wheatDiseases = getDiseasesForCrop(CropType.WHEAT);

    // Wheat should have rust, powdery mildew, bacterial blight
    expect(wheatDiseases).toContain(DiseaseName.RUST);
    expect(wheatDiseases).toContain(DiseaseName.POWDERY_MILDEW);
    expect(wheatDiseases).toContain(DiseaseName.BACTERIAL_BLIGHT);

    // Wheat should NOT have tomato-specific diseases
    expect(wheatDiseases).not.toContain(DiseaseName.LATE_BLIGHT);
    expect(wheatDiseases).not.toContain(DiseaseName.EARLY_BLIGHT);
    expect(wheatDiseases).not.toContain(DiseaseName.SEPTORIA_LEAF_SPOT);
  });

  /**
   * Requirement 4.4: When crop type is selected, System SHALL use crop-specific disease knowledge in the analysis
   */
  test('disease relevance check works correctly for crop-disease combinations', () => {
    // Tomato-relevant diseases
    expect(isDiseaseRelevantToCrop(DiseaseName.LATE_BLIGHT, CropType.TOMATO)).toBe(true);
    expect(isDiseaseRelevantToCrop(DiseaseName.EARLY_BLIGHT, CropType.TOMATO)).toBe(true);

    // Potato-relevant diseases
    expect(isDiseaseRelevantToCrop(DiseaseName.LATE_BLIGHT, CropType.POTATO)).toBe(true);
    expect(isDiseaseRelevantToCrop(DiseaseName.EARLY_BLIGHT, CropType.POTATO)).toBe(true);

    // Wheat-relevant diseases
    expect(isDiseaseRelevantToCrop(DiseaseName.RUST, CropType.WHEAT)).toBe(true);
    expect(isDiseaseRelevantToCrop(DiseaseName.POWDERY_MILDEW, CropType.WHEAT)).toBe(true);

    // Corn-relevant diseases
    expect(isDiseaseRelevantToCrop(DiseaseName.RUST, CropType.CORN)).toBe(true);
    expect(isDiseaseRelevantToCrop(DiseaseName.GRAY_LEAF_SPOT, CropType.CORN)).toBe(true);

    // Soybean-relevant diseases
    expect(isDiseaseRelevantToCrop(DiseaseName.RUST, CropType.SOYBEAN)).toBe(true);
    expect(isDiseaseRelevantToCrop(DiseaseName.FROGEYE_LEAF_SPOT, CropType.SOYBEAN)).toBe(true);

    // Grape-relevant diseases
    expect(isDiseaseRelevantToCrop(DiseaseName.POWDERY_MILDEW, CropType.GRAPE)).toBe(true);
    expect(isDiseaseRelevantToCrop(DiseaseName.BLACK_ROT, CropType.GRAPE)).toBe(true);

    // Apple-relevant diseases
    expect(isDiseaseRelevantToCrop(DiseaseName.APPLE_SCAB, CropType.APPLE)).toBe(true);
    expect(isDiseaseRelevantToCrop(DiseaseName.FIRE_BLIGHT, CropType.APPLE)).toBe(true);
  });

  /**
   * Requirement 4.5: When displaying disease risks, System SHALL show only diseases that affect the selected crop type
   */
  test('irrelevant diseases are filtered out for each crop', () => {
    // Apple diseases should not appear for tomato
    expect(isDiseaseRelevantToCrop(DiseaseName.APPLE_SCAB, CropType.TOMATO)).toBe(false);
    expect(isDiseaseRelevantToCrop(DiseaseName.FIRE_BLIGHT, CropType.TOMATO)).toBe(false);

    // Tomato diseases should not appear for apple
    expect(isDiseaseRelevantToCrop(DiseaseName.LATE_BLIGHT, CropType.APPLE)).toBe(false);
    expect(isDiseaseRelevantToCrop(DiseaseName.EARLY_BLIGHT, CropType.APPLE)).toBe(false);

    // Corn-specific diseases should not appear for wheat
    expect(isDiseaseRelevantToCrop(DiseaseName.GRAY_LEAF_SPOT, CropType.WHEAT)).toBe(false);
    expect(isDiseaseRelevantToCrop(DiseaseName.NORTHERN_CORN_LEAF_BLIGHT, CropType.WHEAT)).toBe(false);
  });

  /**
   * Requirement 4.2: Each crop should have multiple relevant diseases for comprehensive analysis
   */
  test('each crop has multiple diseases for comprehensive risk assessment', () => {
    expect(getDiseasesForCrop(CropType.TOMATO).length).toBeGreaterThanOrEqual(3);
    expect(getDiseasesForCrop(CropType.POTATO).length).toBeGreaterThanOrEqual(2);
    expect(getDiseasesForCrop(CropType.WHEAT).length).toBeGreaterThanOrEqual(2);
    expect(getDiseasesForCrop(CropType.CORN).length).toBeGreaterThanOrEqual(3);
    expect(getDiseasesForCrop(CropType.SOYBEAN).length).toBeGreaterThanOrEqual(3);
    expect(getDiseasesForCrop(CropType.GRAPE).length).toBeGreaterThanOrEqual(3);
    expect(getDiseasesForCrop(CropType.APPLE).length).toBeGreaterThanOrEqual(3);
  });
});
