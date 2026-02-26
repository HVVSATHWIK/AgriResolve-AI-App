# AgriResolve-AI User Guide

## New Features and Improvements

This guide covers the latest features and improvements in AgriResolve-AI.

## Table of Contents

1. [Crop Type Selection](#crop-type-selection)
2. [Rate Limiting and Quotas](#rate-limiting-and-quotas)
3. [Offline Mode](#offline-mode)
4. [Confidence Scores](#confidence-scores)
5. [Chemical Safety Warnings](#chemical-safety-warnings)
6. [Disease Risk Assessment](#disease-risk-assessment)

---

## Crop Type Selection

### Overview

AgriResolve-AI now supports crop-specific disease analysis. By selecting your crop type before analysis, you'll receive more accurate disease risk assessments tailored to your specific crop.

### Supported Crops

- **Tomato** - Late blight, early blight, septoria leaf spot, and more
- **Potato** - Late blight, early blight
- **Wheat** - Rust, powdery mildew, bacterial blight
- **Corn** - Gray leaf spot, northern/southern corn leaf blight, common rust
- **Soybean** - Rust, frogeye leaf spot, brown spot, anthracnose
- **Grape** - Powdery mildew, downy mildew, black rot, botrytis bunch rot
- **Apple** - Apple scab, fire blight, cedar apple rust

### How to Use

1. **Select Your Crop**: Before uploading an image, select your crop type from the dropdown menu
2. **Upload Image**: Upload a clear image of the affected leaf or plant
3. **Receive Analysis**: Get disease risk assessments specific to your crop type

### Benefits

- **Relevant Results**: Only diseases that affect your crop are analyzed
- **Accurate Risk Assessment**: Disease thresholds are calibrated for each crop
- **Better Recommendations**: Guidance tailored to your specific crop's needs

**Requirement**: 4.1 - Crop type selection feature

---

## Rate Limiting and Quotas

### Overview

To ensure fair usage and system stability, AgriResolve-AI implements rate limiting on analysis requests.

### Quota Limits

- **Hourly Limit**: 20 analysis requests per hour
- **Short-term Limit**: 5 requests per 10 minutes
- **Cooldown Period**: If limits are exceeded, you'll need to wait before making more requests

### Understanding the Rate Limit Indicator

The rate limit indicator shows:
- **Requests Remaining**: How many requests you have left in your quota
- **Usage Percentage**: Visual bar showing quota usage
- **Warning**: Appears when you've used 80% or more of your quota (4 or fewer requests remaining)
- **Cooldown Timer**: Shows how long until your quota resets when rate limited

### What Happens When Rate Limited

If you exceed the rate limit:
1. You'll see a message indicating you've been rate limited
2. A countdown timer shows when you can make requests again
3. Your quota resets after the cooldown period (typically 10 minutes to 1 hour)

### Tips for Managing Quotas

- **Plan Your Analyses**: Batch similar images together
- **Use High-Quality Images**: Better images mean fewer re-analyses
- **Monitor Usage**: Keep an eye on the rate limit indicator
- **Wait for Resets**: Quotas reset automatically after the cooldown period

**Requirements**: 7.3, 7.4 - Rate limiting behavior and quotas

---

## Offline Mode

### Overview

AgriResolve-AI can detect when you're offline or when services are unavailable, and will inform you about which features are affected.

### Offline Detection

The system automatically detects:
- **Network Connectivity**: Whether you have an internet connection
- **Service Availability**: Whether backend services (AI analysis, weather data) are accessible

### What Works Offline

When offline, you can still:
- View previously cached analysis results
- Browse your analysis history
- Read educational content and guidance

### What Requires Internet

These features require an active internet connection:
- **New Image Analysis**: Requires AI service
- **Disease Risk Assessment**: Requires weather data
- **Real-time Weather Data**: Requires weather API access

### Offline Indicators

You'll see:
- **Offline Banner**: Appears at the top when network is unavailable
- **Feature Unavailable Messages**: Specific messages for features that need internet
- **Connection Restored Notification**: When connection is re-established

### Manual Weather Data Entry

If the weather API is unavailable, you can:
1. Enter weather data manually (temperature, humidity, wind speed)
2. Continue with disease risk assessment using your manual data
3. Receive analysis with a note that manual data was used

**Requirements**: 14.1, 14.2, 14.3, 14.5 - Offline mode limitations

---

## Confidence Scores

### Overview

Every analysis includes a confidence score that indicates how reliable the results are. Understanding confidence scores helps you make better decisions.

### Confidence Score Components

The overall confidence score is based on:

1. **Weather Data Quality** (60% weight)
   - Complete data: High confidence
   - Partial data: Medium confidence
   - Missing critical data: Low confidence

2. **Model Accuracy** (40% weight)
   - Based on validation testing
   - Conservative estimate: 75%

### Interpreting Confidence Scores

- **80-100%**: High confidence - Results are very reliable
- **60-79%**: Medium confidence - Results are generally reliable
- **40-59%**: Low confidence - Results should be verified
- **Below 40%**: Very low confidence - Consult an expert

### Low Confidence Warnings

When confidence is below 60%, you'll see:
- **Extra Warning Message**: Highlighting the low confidence
- **Recommendation**: Consult with agricultural professionals
- **Explanation**: Why confidence is low (e.g., missing weather data)

### Experimental Disclaimer

All analyses include a disclaimer that:
- The system is experimental and for decision support only
- Results should not be the sole basis for treatment decisions
- Professional consultation is recommended for important decisions

### Best Practices

- **Don't Rely Solely on Low Confidence Results**: Seek expert advice
- **Improve Data Quality**: Provide location for weather data
- **Use High-Quality Images**: Better images improve confidence
- **Consult Professionals**: Especially for critical decisions

**Requirements**: 9.1, 9.2, 9.3, 9.5 - Confidence score interpretation

---

## Chemical Safety Warnings

### Overview

AgriResolve-AI includes a chemical safety checker that warns you about restricted or banned chemicals in recommendations.

### Chemical Database

The system checks for:
- **Restricted Chemicals**: Chemicals with usage restrictions
- **Banned Chemicals**: Chemicals prohibited in many regions
- **Common Synonyms**: Alternative names for chemicals
- **Unit Variations**: Different ways to express measurements (ml, milliliter, etc.)

### Warnings You Might See

1. **Database Incomplete Disclaimer**
   - Appears with any chemical recommendation
   - Reminds you that the database may not be complete
   - Recommends consulting local agricultural extension

2. **Restricted Chemical Warning**
   - Appears when a restricted chemical is detected
   - Provides specific information about the chemical
   - Recommends checking local regulations

3. **Banned Chemical Alert**
   - Appears when a banned chemical is detected
   - Strong warning not to use the chemical
   - Recommends safer alternatives

### Important Limitations

- **Database is Not Complete**: Not all chemicals are in the database
- **Regional Variations**: Regulations vary by country and region
- **Always Verify**: Check with local agricultural extension office
- **Safety First**: Follow all safety guidelines and regulations

### What to Do When You See a Warning

1. **Stop**: Don't proceed with the chemical without verification
2. **Research**: Check local regulations and restrictions
3. **Consult**: Contact your local agricultural extension office
4. **Consider Alternatives**: Look for safer, approved alternatives
5. **Follow Guidelines**: Always follow product labels and safety data sheets

### Recommended Resources

- Local agricultural extension office
- Regional pesticide regulatory authority
- Product safety data sheets (SDS)
- Integrated Pest Management (IPM) guidelines

**Requirements**: 10.1, 10.2, 10.4 - Chemical database limitations

---

## Disease Risk Assessment

### Overview

When you provide your location and crop type, AgriResolve-AI calculates disease-specific risk scores based on current weather conditions.

### How It Works

The system:
1. **Fetches Weather Data**: Gets current temperature, humidity, wind speed
2. **Calculates Leaf Wetness**: Estimates how long leaves have been wet
3. **Applies Disease Thresholds**: Uses crop-specific and disease-specific thresholds
4. **Calculates Risk Scores**: Determines risk level for each relevant disease

### Risk Levels

- **Low (0-24%)**: Conditions not favorable for disease
- **Medium (25-49%)**: Some risk, monitor closely
- **High (50-74%)**: Favorable conditions, take preventive action
- **Critical (75-100%)**: Very favorable conditions, immediate action recommended

### Risk Factors

Each disease risk includes:
- **Temperature**: How current temperature affects disease development
- **Humidity**: Impact of relative humidity on disease risk
- **Leaf Wetness Duration**: Hours of leaf wetness (critical for many diseases)

### Understanding Results

**Example**: Late Blight on Tomato
- **Risk Level**: High (68%)
- **Factors**:
  - Temperature: 18°C (optimal for late blight)
  - Humidity: 85% (high, favorable)
  - Leaf Wetness: 12 hours (exceeds 10-hour threshold)
- **Recommendation**: Monitor closely, consider preventive measures

### Weather Data Sources

- **Automatic**: Weather data fetched from Open-Meteo API
- **Manual Entry**: You can enter weather data if API is unavailable
- **Timezone Aware**: Calculations account for your local timezone

### Limitations

- **Weather Data Accuracy**: Depends on weather API data quality
- **Local Variations**: Microclimate may differ from weather station
- **Model Limitations**: Risk models are estimates, not guarantees
- **Professional Advice**: Always consult experts for critical decisions

### Best Practices

- **Provide Accurate Location**: Enables better weather data
- **Monitor Regularly**: Check risk scores throughout the growing season
- **Combine with Observation**: Use risk scores alongside field observations
- **Take Preventive Action**: Act on high-risk warnings before disease appears
- **Consult Experts**: For treatment decisions and disease confirmation

---

## Getting Help

### Support Resources

- **Documentation**: Check this user guide and other documentation
- **FAQ**: Common questions and answers
- **Contact**: Reach out to support team for technical issues

### Reporting Issues

If you encounter problems:
1. Note the error message or unexpected behavior
2. Check your internet connection
3. Try refreshing the page
4. Contact support if issue persists

### Feedback

We welcome your feedback on:
- Feature requests
- Usability improvements
- Bug reports
- Documentation clarity

---

## Privacy and Security

### Data Protection

- **API Keys**: Never exposed in your browser
- **Session Security**: Secure session management
- **HTTPS**: All production traffic encrypted
- **No Personal Data Storage**: Images and analyses are not permanently stored

### Best Practices

- **Use HTTPS**: Always access via secure connection
- **Keep Software Updated**: Use latest version for security fixes
- **Report Security Issues**: Contact us immediately if you find vulnerabilities

---

## Updates and Changes

This guide reflects the latest version of AgriResolve-AI. Check back regularly for updates on new features and improvements.

**Last Updated**: [Current Date]
**Version**: 2.0 (Backend Proxy Security Update)
