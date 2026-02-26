# Requirements Document

## Introduction

AgriResolve-AI is a crop health diagnostic tool that uses Gemini AI for multi-agent analysis of crop diseases. This specification addresses critical production issues related to agricultural accuracy, security vulnerabilities, scientific transparency, and data reliability. The system must provide scientifically sound disease risk assessments while protecting sensitive API credentials and communicating uncertainty appropriately to users.

## Glossary

- **System**: The AgriResolve-AI application (frontend and backend components)
- **Backend_Server**: The server-side proxy component that handles API calls
- **Gemini_API**: Google's Gemini 2.5 Flash AI API service
- **Disease_Risk_Model**: Crop-specific and disease-specific calculation engine for risk assessment
- **Leaf_Detector**: Image processing component that identifies leaf regions in uploaded photos
- **Weather_Validator**: Component that validates and processes weather data from external APIs
- **Rate_Limiter**: Component that enforces request quotas and cooldown periods
- **Chemical_Safety_Checker**: Component that detects restricted substances in user inputs
- **Confidence_Score**: Experimental metric indicating analysis certainty (0-100%)
- **Leaf_Wetness_Duration**: Hours per day that leaf surfaces remain wet (critical for disease risk)
- **User**: Agricultural professional or farmer using the diagnostic tool

## Requirements

### Requirement 1: Disease-Specific Risk Assessment

**User Story:** As an agricultural professional, I want disease risk calculations tailored to specific crops and diseases, so that I receive accurate and actionable diagnostic information.

#### Acceptance Criteria

1. WHEN calculating disease risk for a crop, THE Disease_Risk_Model SHALL use crop-specific temperature thresholds for each disease type
2. WHEN calculating disease risk for a crop, THE Disease_Risk_Model SHALL use disease-specific leaf wetness duration thresholds
3. WHEN assessing late blight risk, THE Disease_Risk_Model SHALL apply temperature range 10-25°C and minimum 10 hours leaf wetness
4. WHEN assessing powdery mildew risk, THE Disease_Risk_Model SHALL apply temperature range 15-30°C and minimum 6 hours leaf wetness
5. WHEN assessing rust disease risk, THE Disease_Risk_Model SHALL apply temperature range 15-25°C and minimum 8 hours leaf wetness
6. WHEN multiple diseases are possible for a crop, THE Disease_Risk_Model SHALL calculate separate risk scores for each disease
7. WHEN a disease is not relevant to the selected crop type, THE Disease_Risk_Model SHALL exclude it from the analysis

### Requirement 2: Improved Leaf Wetness Calculation

**User Story:** As an agricultural scientist, I want accurate leaf wetness duration estimates, so that disease risk predictions reflect real field conditions.

#### Acceptance Criteria

1. WHEN calculating leaf wetness duration, THE Disease_Risk_Model SHALL incorporate solar radiation proxy based on time of day
2. WHEN calculating leaf wetness duration, THE Disease_Risk_Model SHALL apply wind speed effects on drying rate
3. WHEN calculating leaf wetness duration with wind speed above 3 m/s, THE Disease_Risk_Model SHALL reduce wetness duration by 20%
4. WHEN calculating leaf wetness duration during daylight hours, THE Disease_Risk_Model SHALL apply increased evaporation rate
5. WHEN relative humidity exceeds 90%, THE Disease_Risk_Model SHALL assume leaf surfaces remain wet
6. WHEN dew point temperature equals or exceeds air temperature, THE Disease_Risk_Model SHALL count those hours as wet

### Requirement 3: Refined Leaf Detection

**User Story:** As a user uploading crop images, I want the system to accurately identify leaf regions and exclude non-leaf objects, so that analysis focuses on relevant plant tissue.

#### Acceptance Criteria

1. WHEN detecting healthy leaf regions, THE Leaf_Detector SHALL use hue range 70-170 degrees
2. WHEN detecting diseased leaf regions, THE Leaf_Detector SHALL use hue range 35-70 degrees for yellow/brown discoloration
3. WHEN filtering candidate regions, THE Leaf_Detector SHALL exclude pixels with saturation below 20%
4. WHEN filtering candidate regions, THE Leaf_Detector SHALL exclude pixels with brightness below 15% or above 95%
5. WHEN processing an image, THE Leaf_Detector SHALL apply multi-stage filtering to remove soil, wood, and background objects
6. WHEN tested on non-leaf objects, THE Leaf_Detector SHALL achieve false positive rate below 5%

### Requirement 4: Crop Type Identification

**User Story:** As a user, I want to specify my crop type, so that the system provides relevant disease analysis and filters out irrelevant diseases.

#### Acceptance Criteria

1. WHEN a user uploads an image, THE System SHALL prompt the user to select a crop type from available options
2. WHEN a crop type is selected, THE System SHALL filter disease analysis to include only diseases relevant to that crop
3. THE System SHALL support crop types including tomato, potato, wheat, corn, soybean, grape, and apple
4. WHEN a crop type is selected, THE System SHALL use crop-specific disease knowledge in the analysis
5. WHEN displaying disease risks, THE System SHALL show only diseases that affect the selected crop type

### Requirement 5: Backend API Security

**User Story:** As a system administrator, I want all AI API calls proxied through the backend server, so that API keys remain secure and never exposed to clients.

#### Acceptance Criteria

1. WHEN the System makes a Gemini_API call, THE Backend_Server SHALL proxy the request
2. THE System SHALL NOT expose Gemini_API keys in client-side code or network traffic
3. WHEN the Backend_Server receives an API request, THE Backend_Server SHALL validate the request before forwarding to Gemini_API
4. THE Backend_Server SHALL inject API credentials server-side before calling Gemini_API
5. WHEN the Backend_Server returns API responses, THE Backend_Server SHALL sanitize any sensitive information before sending to client

### Requirement 6: Secure Development Server Configuration

**User Story:** As a security-conscious developer, I want the development server bound to localhost only, so that it is not exposed to the network during development.

#### Acceptance Criteria

1. WHEN the development server starts, THE System SHALL bind to localhost (127.0.0.1) only
2. THE System SHALL NOT bind to 0.0.0.0 or any public network interface in development mode
3. WHEN the server configuration is set for production, THE System SHALL allow explicit network binding configuration

### Requirement 7: Rate Limiting

**User Story:** As a system administrator, I want to enforce API usage limits, so that costs remain controlled and abuse is prevented.

#### Acceptance Criteria

1. WHEN a user makes analysis requests, THE Rate_Limiter SHALL track request count per user session
2. WHEN a user exceeds 5 requests within 10 minutes, THE Rate_Limiter SHALL block additional requests
3. WHEN a user is rate-limited, THE System SHALL display remaining cooldown time
4. WHEN a user is rate-limited, THE System SHALL display a clear message explaining the limit
5. THE Backend_Server SHALL enforce a maximum of 20 requests per hour per user
6. WHEN displaying the analysis interface, THE System SHALL show remaining request quota to the user

### Requirement 8: Input Validation

**User Story:** As a system administrator, I want comprehensive input validation, so that invalid or malicious data is rejected before processing.

#### Acceptance Criteria

1. WHEN receiving weather data, THE Weather_Validator SHALL validate temperature values are within range -50°C to 60°C
2. WHEN receiving weather data, THE Weather_Validator SHALL validate relative humidity values are within range 0% to 100%
3. WHEN receiving weather data, THE Weather_Validator SHALL validate wind speed values are non-negative
4. WHEN receiving user text input, THE System SHALL sanitize input to prevent injection attacks
5. WHEN receiving image uploads, THE System SHALL validate file type is an accepted image format
6. WHEN receiving image uploads, THE System SHALL validate file size does not exceed 10MB

### Requirement 9: Confidence Score Transparency

**User Story:** As a user making agricultural decisions, I want clear warnings about confidence score limitations, so that I understand these are experimental metrics and seek professional advice for critical decisions.

#### Acceptance Criteria

1. WHEN displaying confidence scores, THE System SHALL show a disclaimer that scores are experimental and not scientifically validated
2. WHEN displaying confidence scores, THE System SHALL recommend consulting agricultural professionals for critical decisions
3. WHEN displaying confidence scores, THE System SHALL provide a breakdown of confidence components
4. THE System SHALL display the disclaimer prominently near all confidence score displays
5. WHEN a confidence score is below 60%, THE System SHALL display an additional warning about low confidence

### Requirement 10: Chemical Database Disclaimer

**User Story:** As a user receiving chemical recommendations, I want clear notice that the restriction database is incomplete, so that I verify recommendations with local authorities before application.

#### Acceptance Criteria

1. WHEN displaying chemical recommendations, THE System SHALL show a disclaimer that the restriction database is incomplete
2. WHEN displaying chemical recommendations, THE System SHALL recommend consulting local agricultural extension offices
3. THE System SHALL display the chemical database disclaimer prominently on all pages showing chemical information
4. WHEN a restricted chemical is detected, THE System SHALL display a warning with the disclaimer

### Requirement 11: Weather Data Validation and Null Handling

**User Story:** As a data scientist, I want missing weather data represented as null rather than fallback values, so that analysis accurately reflects data availability and uncertainty.

#### Acceptance Criteria

1. WHEN weather API returns missing temperature data, THE Weather_Validator SHALL set the value to null
2. WHEN weather API returns missing humidity data, THE Weather_Validator SHALL set the value to null
3. THE Weather_Validator SHALL NOT use zero or default fallback values for missing weather data
4. WHEN weather data contains null values, THE System SHALL notify the user that some data is unavailable
5. WHEN critical weather data is null, THE System SHALL indicate that disease risk calculations may be incomplete
6. WHEN displaying weather data, THE System SHALL clearly indicate which values are missing or unavailable

### Requirement 12: Timezone Handling

**User Story:** As a user in any timezone, I want weather data and timestamps handled correctly for my location, so that disease risk calculations use accurate temporal information.

#### Acceptance Criteria

1. WHEN requesting weather data, THE System SHALL explicitly specify the user's timezone
2. WHEN processing weather timestamps, THE System SHALL validate timezone information is present
3. WHEN timezone information is missing, THE System SHALL request the user's location or timezone
4. WHEN calculating leaf wetness duration, THE System SHALL use timezone-aware timestamps for daylight calculations
5. WHEN displaying timestamps to users, THE System SHALL show times in the user's local timezone

### Requirement 13: Enhanced Chemical Safety Detection

**User Story:** As a safety officer, I want the system to detect chemical name variations and synonyms, so that restricted substances are identified regardless of spelling variations.

#### Acceptance Criteria

1. WHEN checking user input for chemicals, THE Chemical_Safety_Checker SHALL detect common spelling variations
2. WHEN checking for volume units, THE Chemical_Safety_Checker SHALL recognize "ml", "milliliter", and "millilitre" as equivalent
3. WHEN checking for mass units, THE Chemical_Safety_Checker SHALL recognize "g", "gram", and "gramme" as equivalent
4. WHEN checking chemical names, THE Chemical_Safety_Checker SHALL detect common synonyms for restricted substances
5. WHEN a chemical variation is detected, THE Chemical_Safety_Checker SHALL apply the same safety warnings as the primary name

### Requirement 14: Offline Mode Communication

**User Story:** As a user with intermittent internet connectivity, I want clear messaging about internet requirements, so that I understand when features are unavailable.

#### Acceptance Criteria

1. WHEN the System detects no internet connection, THE System SHALL display an offline mode message
2. WHEN in offline mode, THE System SHALL clearly indicate which features require internet connectivity
3. WHEN the System regains internet connection, THE System SHALL notify the user that online features are available
4. THE System SHALL detect offline status before attempting API calls
5. WHEN a feature requires internet and the user is offline, THE System SHALL display a specific message explaining the requirement

### Requirement 15: API Usage Indicators

**User Story:** As a user, I want to see my API quota usage, so that I can manage my requests and avoid hitting limits unexpectedly.

#### Acceptance Criteria

1. WHEN displaying the analysis interface, THE System SHALL show the number of requests used in the current period
2. WHEN displaying the analysis interface, THE System SHALL show the number of requests remaining in the current period
3. WHEN a user approaches the rate limit (80% of quota), THE System SHALL display a warning
4. WHEN displaying usage statistics, THE System SHALL show when the quota will reset
5. THE System SHALL update usage indicators after each analysis request

### Requirement 16: Progressive Enhancement and Graceful Degradation

**User Story:** As a user experiencing service disruptions, I want the application to degrade gracefully, so that I can still access available features when some services are down.

#### Acceptance Criteria

1. WHEN the Gemini_API is unavailable, THE System SHALL display cached or basic analysis if available
2. WHEN the weather API is unavailable, THE System SHALL allow manual weather data entry
3. WHEN a service fails, THE System SHALL display a specific error message indicating which service is unavailable
4. WHEN a service fails, THE System SHALL continue to provide other available features
5. THE System SHALL NOT crash or become completely unusable when a single service fails
