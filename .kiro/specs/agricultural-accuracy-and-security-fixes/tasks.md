# Implementation Plan: Agricultural Accuracy and Security Fixes

## Overview

This implementation plan addresses critical production issues in AgriResolve-AI by implementing disease-specific risk models, backend API security, improved leaf detection, and enhanced data reliability. The implementation follows an incremental approach, building from backend security foundations through data validation to frontend enhancements, with testing integrated throughout.

## Tasks

- [ ] 1. Backend API proxy and security hardening
  - [x] 1.1 Create secure backend API proxy server
    - Set up Express.js server with session management
    - Configure CORS for frontend communication
    - Bind to localhost (127.0.0.1) in development mode
    - Add environment variable configuration for production
    - _Requirements: 5.1, 5.4, 6.1, 6.3_
  
  - [x] 1.2 Implement rate limiting middleware
    - Add express-rate-limit for 20 requests/hour per session
    - Implement short-term rate limiter (5 requests/10 minutes)
    - Create session-based request tracking
    - Return appropriate error responses with cooldown times
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [x] 1.3 Write property test for rate limiting
    - **Property 15: Request tracking**
    - **Validates: Requirements 7.1**
  
  - [x] 1.4 Implement input validation middleware
    - Validate image file type and size (max 10MB)
    - Validate crop type against supported types
    - Sanitize text inputs to prevent injection attacks
    - Validate request structure and required fields
    - _Requirements: 8.4, 8.5, 8.6_
  
  - [x] 1.5 Write property tests for input validation
    - **Property 20: Input sanitization**
    - **Property 21: Image file type validation**
    - **Property 22: Image file size validation**
    - **Validates: Requirements 8.4, 8.5, 8.6**
  
  - [x] 1.6 Create Gemini API proxy endpoint
    - Create POST /api/analysis endpoint
    - Inject API key server-side from environment variables
    - Validate requests before forwarding to Gemini API
    - Sanitize responses before returning to client
    - Never expose API keys in responses or logs
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 1.7 Write property tests for API security
    - **Property 11: Backend API proxying**
    - **Property 12: API key protection**
    - **Property 13: Request validation before proxying**
    - **Property 14: Response sanitization**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [x] 2. Checkpoint - Verify backend security
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Weather data validation and null handling
  - [x] 3.1 Create WeatherValidator class
    - Implement validateTemperature (-50°C to 60°C range)
    - Implement validateHumidity (0% to 100% range)
    - Implement validateWindSpeed (non-negative)
    - Return null for missing or invalid values (no fallbacks)
    - Calculate data quality (COMPLETE, PARTIAL, INSUFFICIENT)
    - _Requirements: 8.1, 8.2, 8.3, 11.1, 11.2_
  
  - [x] 3.2 Write property tests for weather validation
    - **Property 17: Temperature range validation**
    - **Property 18: Humidity range validation**
    - **Property 19: Wind speed non-negativity validation**
    - **Property 27: Null handling for missing weather data**
    - **Validates: Requirements 8.1, 8.2, 8.3, 11.1, 11.2**
  
  - [x] 3.3 Implement timezone handling
    - Add explicit timezone parameter to weather API requests
    - Validate timezone information in all timestamps
    - Create timezone-aware timestamp conversion utilities
    - Implement user timezone detection and storage
    - _Requirements: 12.1, 12.2_
  
  - [x] 3.4 Write property tests for timezone handling
    - **Property 30: Timezone specification in weather requests**
    - **Property 31: Timezone validation in timestamps**
    - **Property 32: Timezone-aware leaf wetness calculation**
    - **Property 33: Local timezone display**
    - **Validates: Requirements 12.1, 12.2, 12.4, 12.5**
  
  - [x] 3.5 Create weather data availability checker
    - Implement handleMissingData function
    - Determine which fields are missing
    - Assess if risk calculation is possible
    - Generate user-facing messages for missing data
    - _Requirements: 11.4, 11.5, 11.6_
  
  - [x] 3.6 Write property tests for missing data handling
    - **Property 28: Missing data notification**
    - **Property 29: Incomplete risk calculation indication**
    - **Validates: Requirements 11.4, 11.5, 11.6**

- [x] 4. Disease-specific risk model implementation
  - [x] 4.1 Create disease threshold configuration
    - Define DISEASE_THRESHOLDS constant with crop-disease mappings
    - Include temperature ranges for each disease
    - Include minimum wetness hours for each disease
    - Include optimal temperature for each disease
    - Cover late blight, powdery mildew, rust, and other common diseases
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 4.2 Implement DiseaseRiskModel class
    - Create calculateRisk method with crop-specific logic
    - Filter diseases by crop type relevance
    - Apply disease-specific thresholds
    - Calculate separate risk scores for each applicable disease
    - Return risk factors with contribution percentages
    - _Requirements: 1.1, 1.2, 1.6, 1.7_
  
  - [x] 4.3 Write property tests for disease risk calculation
    - **Property 1: Disease-specific threshold application**
    - **Property 2: Multiple disease risk calculation**
    - **Property 3: Irrelevant disease filtering**
    - **Validates: Requirements 1.1, 1.2, 1.6, 1.7**
  
  - [x] 4.4 Implement enhanced leaf wetness calculation
    - Create calculateLeafWetness function
    - Implement humidity-based wetness detection (>90% RH)
    - Implement dew point comparison logic
    - Add wind speed reduction factor (>3 m/s reduces by 20%)
    - Add solar radiation proxy using time of day
    - Apply daylight evaporation rate adjustment
    - Use timezone-aware timestamps for daylight detection
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 4.5 Write property tests for leaf wetness calculation
    - **Property 4: Solar radiation effect on leaf wetness**
    - **Property 5: Wind speed effect on leaf wetness**
    - **Property 6: Dew point wetness detection**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.6**
  
  - [x] 4.6 Write unit tests for specific disease thresholds
    - Test late blight with exact threshold values (10-25°C, 10h wetness)
    - Test powdery mildew with exact threshold values (15-30°C, 6h wetness)
    - Test rust with exact threshold values (15-25°C, 8h wetness)
    - Test wind speed reduction at exactly 3 m/s
    - Test humidity wetness at exactly 90% RH
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.5_

- [x] 5. Checkpoint - Verify disease risk calculations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Enhanced leaf detection implementation
  - [x] 6.1 Create LeafDetector class with refined color filtering
    - Implement convertToHSV utility function
    - Implement healthy leaf hue detection (70-170 degrees)
    - Implement diseased leaf hue detection (35-70 degrees)
    - Implement saturation filter (minimum 20%)
    - Implement brightness filter (15-95% range)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 6.2 Write property tests for color filtering
    - **Property 7: Healthy leaf hue range detection**
    - **Property 8: Diseased leaf hue range detection**
    - **Property 9: Pixel filtering criteria**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [x] 6.3 Implement multi-stage filtering
    - Create groupIntoRegions function for connected components
    - Implement morphological filters (erosion, dilation)
    - Create filterNonLeafRegions with texture analysis
    - Add color variance calculation to detect uniform backgrounds
    - Add size ratio filtering (0.01 to 0.8 of image)
    - _Requirements: 3.5_
  
  - [x] 6.4 Implement false positive rate calculation
    - Create calculateFalsePositiveRate function
    - Add detection confidence calculation
    - Separate healthy and diseased region classification
    - _Requirements: 3.6_
  
  - [x] 6.5 Write property test for false positive rate
    - **Property 10: False positive rate threshold**
    - **Validates: Requirements 3.6**
  
  - [x] 6.6 Write unit tests for leaf detection edge cases
    - Test with pure green image (hue 120°)
    - Test with pure yellow image (hue 50°)
    - Test with grayscale image (low saturation)
    - Test with very dark image (brightness 10%)
    - Test with very bright image (brightness 98%)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Crop type selection and filtering
  - [x] 7.1 Create CropType enum and crop information database
    - Define CropType enum with supported crops
    - Create CROP_INFO mapping with common diseases per crop
    - Include optimal temperature ranges per crop
    - _Requirements: 4.3_
  
  - [x] 7.2 Implement crop type selector UI component
    - Create dropdown/selector for crop type selection
    - Display crop type selection before image upload
    - Pass selected crop type to backend with analysis request
    - _Requirements: 4.1_
  
  - [x] 7.3 Integrate crop type filtering in disease risk model
    - Filter diseases based on selected crop type
    - Use crop-specific disease knowledge in analysis
    - Ensure only relevant diseases appear in results
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [x] 7.4 Write unit tests for crop type selection
    - Test that crop selector displays all supported crop types
    - Test that selecting tomato filters to tomato-relevant diseases
    - Test that selecting wheat filters to wheat-relevant diseases
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Chemical safety checker enhancement
  - [x] 8.1 Create ChemicalSafetyChecker class
    - Define CHEMICAL_PATTERNS with volume unit variations
    - Define CHEMICAL_PATTERNS with mass unit variations
    - Define restrictedChemicals list with synonyms
    - Implement checkInput function with variation detection
    - Generate common misspellings for chemical names
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [x] 8.2 Write property tests for chemical detection
    - **Property 34: Chemical variation detection**
    - **Property 35: Consistent warnings for chemical variations**
    - **Validates: Requirements 13.1, 13.5**
  
  - [x] 8.3 Write unit tests for specific chemical variations
    - Test "ml" vs "milliliter" vs "millilitre" detection
    - Test "g" vs "gram" vs "gramme" detection
    - Test paraquat and gramoxone synonym detection
    - Test chlorpyrifos variations detection
    - _Requirements: 13.2, 13.3_

- [x] 9. Frontend rate limit UI and offline detection
  - [x] 9.1 Create RateLimitIndicator component
    - Display quota bar showing usage percentage
    - Show requests remaining / total quota
    - Display warning when approaching limit (80% used)
    - Show cooldown timer when rate limited
    - Update indicators after each request
    - _Requirements: 7.3, 7.4, 7.6, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 9.2 Write property test for usage indicator updates
    - **Property 16: Usage indicator updates**
    - **Validates: Requirements 15.5**
  
  - [x] 9.3 Write unit tests for rate limit UI states
    - Test display at 0% usage (20/20 remaining)
    - Test display at 80% usage (4/20 remaining) - should show warning
    - Test display at 100% usage (0/20 remaining) - should show cooldown
    - Test cooldown timer countdown
    - _Requirements: 7.3, 7.4, 15.3_
  
  - [x] 9.4 Create OfflineDetector class
    - Implement isOnline check using navigator.onLine
    - Add event listeners for online/offline events
    - Implement checkAPIAvailability with health endpoint
    - Create status change callback system
    - _Requirements: 14.1, 14.4_
  
  - [x] 9.5 Implement offline mode UI messaging
    - Display offline banner when network is unavailable
    - Show which features require internet connectivity
    - Display notification when connection is restored
    - Show specific message when feature needs internet while offline
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [x] 9.6 Write property test for offline detection
    - **Property 36: Pre-call offline detection**
    - **Validates: Requirements 14.4**
  
  - [x] 9.7 Write unit tests for offline UI states
    - Test offline banner display when navigator.onLine = false
    - Test online notification when connection restored
    - Test feature unavailable message when offline
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

- [x] 10. Checkpoint - Verify frontend enhancements
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Transparency and disclaimer implementation
  - [x] 11.1 Create ConfidenceScoreDisplay component
    - Display confidence score with experimental disclaimer
    - Show breakdown of confidence components (weather data, image analysis, model accuracy)
    - Include recommendation to consult agricultural professionals
    - Display additional warning when confidence < 60%
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [x] 11.2 Write property tests for confidence display
    - **Property 23: Confidence score disclaimer display**
    - **Property 24: Low confidence warning**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.5**
  
  - [x] 11.3 Write unit tests for confidence score thresholds
    - Test display with confidence = 59% (should show extra warning)
    - Test display with confidence = 60% (should not show extra warning)
    - Test that all three components are shown in breakdown
    - _Requirements: 9.3, 9.5_
  
  - [x] 11.4 Create ChemicalDisclaimerDisplay component
    - Display disclaimer that database is incomplete
    - Show recommendation to consult local agricultural extension
    - Display warning when restricted chemical is detected
    - Show specific recommendations for detected chemicals
    - _Requirements: 10.1, 10.2, 10.4_
  
  - [x] 11.5 Write property tests for chemical disclaimers
    - **Property 25: Chemical database disclaimer display**
    - **Property 26: Restricted chemical warning**
    - **Validates: Requirements 10.1, 10.2, 10.4**
  
  - [x] 11.6 Write unit tests for chemical warning display
    - Test disclaimer appears with any chemical recommendation
    - Test warning appears when restricted chemical detected
    - Test specific recommendation text for banned vs restricted chemicals
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 12. Graceful degradation and error handling
  - [x] 12.1 Implement service availability checking
    - Create health check endpoint on backend
    - Implement checkAPIAvailability for Gemini API
    - Implement checkAPIAvailability for weather API
    - Track service status in application state
    - _Requirements: 16.1, 16.2_
  
  - [x] 12.2 Implement graceful degradation logic
    - Allow analysis to continue with partial data
    - Offer cached results when Gemini API unavailable
    - Allow manual weather data entry when weather API unavailable
    - Display specific error messages for each service failure
    - Ensure app doesn't crash on single service failure
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 12.3 Write property tests for graceful degradation
    - **Property 37: Service failure error messaging**
    - **Property 38: Graceful degradation on service failure**
    - **Validates: Requirements 16.3, 16.4, 16.5**
  
  - [x] 12.4 Write unit tests for service failure scenarios
    - Test with Gemini API returning 503 error
    - Test with weather API timeout
    - Test with both APIs unavailable
    - Test that other features continue working when one service fails
    - _Requirements: 16.1, 16.2, 16.4, 16.5_
  
  - [x] 12.5 Implement comprehensive error response format
    - Create ErrorResponse interface with error codes
    - Include retryable flag and retryAfter time
    - List affected features in error response
    - Provide user-friendly error messages
    - _Requirements: 16.3_

- [x] 13. Integration and wiring
  - [x] 13.1 Update frontend to use backend API proxy
    - Replace direct Gemini API calls with backend proxy calls
    - Remove API key from frontend environment variables
    - Add session management to frontend
    - Handle rate limit responses from backend
    - _Requirements: 5.1, 5.2, 7.1_
  
  - [x] 13.2 Wire disease risk model into analysis flow
    - Integrate DiseaseRiskModel into backend analysis endpoint
    - Fetch and validate weather data for user location
    - Calculate leaf wetness duration with timezone awareness
    - Calculate disease risks for selected crop type
    - Include disease risks in analysis response
    - _Requirements: 1.1, 1.2, 1.6, 1.7, 2.1, 2.2, 2.4, 2.6_
  
  - [x] 13.3 Wire enhanced leaf detector into analysis flow
    - Integrate LeafDetector into image processing pipeline
    - Apply refined color filtering before AI analysis
    - Include leaf detection results in analysis response
    - Display detected leaf regions in UI
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [x] 13.4 Wire chemical safety checker into analysis flow
    - Integrate ChemicalSafetyChecker into text analysis
    - Check user inputs and AI recommendations for restricted chemicals
    - Display warnings and disclaimers when chemicals detected
    - _Requirements: 13.1, 13.5_
  
  - [x] 13.5 Wire all UI components into main application
    - Add RateLimitIndicator to analysis page
    - Add OfflineDetector to application root
    - Add ConfidenceScoreDisplay to results page
    - Add ChemicalDisclaimerDisplay to results page
    - Add crop type selector to upload page
    - _Requirements: 4.1, 7.6, 9.1, 10.1, 14.1_
  
  - [x] 13.6 Write integration tests for complete analysis flow
    - Test complete flow: select crop → upload image → receive analysis with disease risks
    - Test rate limiting flow: make 6 requests → verify cooldown
    - Test offline flow: disconnect network → attempt analysis → verify message
    - Test missing weather data flow: simulate API failure → verify manual entry option
    - Test low confidence flow: receive low confidence → verify extra warnings

- [x] 14. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Documentation and deployment preparation
  - [x] 15.1 Update environment variable documentation
    - Document GEMINI_API_KEY for backend
    - Document SESSION_SECRET for backend
    - Document HOST and PORT configuration
    - Document FRONTEND_URL for CORS
    - Document NODE_ENV for development vs production
    - _Requirements: 5.4, 6.1, 6.3_
  
  - [x] 15.2 Create migration guide for existing deployments
    - Document backend server setup steps
    - Document environment variable migration
    - Document frontend configuration changes
    - Document testing procedures for security verification
    - _Requirements: 5.1, 5.2, 6.1_
  
  - [x] 15.3 Update user-facing documentation
    - Document crop type selection feature
    - Document rate limiting behavior and quotas
    - Document offline mode limitations
    - Document confidence score interpretation
    - Document chemical database limitations
    - _Requirements: 4.1, 7.3, 9.1, 10.1, 14.1_

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties with minimum 100 iterations each
- Unit tests validate specific examples, edge cases, and boundary conditions
- Backend security tasks are prioritized first to protect API keys immediately
- Integration tasks at the end ensure all components work together correctly
