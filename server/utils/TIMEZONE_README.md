# Timezone Handling Implementation

This document describes the timezone handling implementation for the AgriResolve-AI application.

## Overview

The timezone handling system ensures that all weather data and timestamps are processed with explicit timezone information, enabling accurate disease risk calculations and proper display of times to users.

## Requirements Addressed

- **12.1**: Add explicit timezone parameter to weather API requests
- **12.2**: Validate timezone information in all timestamps
- **12.3**: Request user's timezone when missing
- **12.4**: Use timezone-aware timestamps for daylight calculations
- **12.5**: Display times in user's local timezone

## Architecture

### Backend Components

#### 1. `timezoneUtils.ts`
Core timezone utilities providing:
- **Timezone Validation**: Validates timezone strings using `Intl.DateTimeFormat`
- **Timezone Conversion**: Converts UTC timestamps to timezone-aware format
- **Daylight Detection**: Determines if a given hour is during daylight (for leaf wetness calculations)
- **User Timezone Detection**: Detects timezone from browser (server-side fallback)
- **Weather API Parameters**: Creates weather API request parameters with explicit timezone

Key Functions:
```typescript
validateTimezone(timezone: any): TimezoneValidationResult
convertToTimezone(timestamp: Date, timezone: string): TimezoneAwareTimestamp
isDaylightHour(timestamp: Date, timezone: string, latitude?: number): DaylightInfo
detectUserTimezone(): UserTimezoneInfo
createWeatherAPIParams(latitude: number, longitude: number, timezone: string): URLSearchParams
```

#### 2. `userTimezoneStorage.ts`
Session-based timezone storage:
- **Session Integration**: Extends Express session to store user timezone
- **Timezone Retrieval**: Gets user timezone from session or detects it
- **Timezone Storage**: Stores validated timezone in session
- **Weather API Integration**: Provides timezone for weather API requests

Key Functions:
```typescript
getUserTimezone(req: Request): UserTimezoneInfo
setUserTimezone(req: Request, timezone: string, detectionMethod: string): boolean
getTimezoneForWeatherAPI(req: Request): string
```

#### 3. `weatherValidator.ts` (Updated)
Enhanced to validate timezone information:
- Validates timezone in weather data using `validateTimezone()`
- Validates timestamp-timezone combinations using `validateTimestampWithTimezone()`
- Throws error if timezone validation fails

#### 4. `weatherService.ts`
Backend weather service with timezone support:
- **Current Weather**: Fetches current weather with explicit timezone
- **Hourly Weather**: Fetches hourly weather data with explicit timezone
- **Timezone Parsing**: Parses and validates timezone from API responses
- **Data Validation**: Validates all weather data including timezone

Key Functions:
```typescript
fetchCurrentWeather(latitude: number, longitude: number, req?: Request): Promise<ValidatedWeatherData | null>
fetchHourlyWeather(latitude: number, longitude: number, req?: Request, options?: {...}): Promise<ValidatedWeatherData[] | null>
```

#### 5. `routes/timezone.ts`
API endpoints for timezone management:
- `GET /api/timezone` - Get current user timezone from session
- `POST /api/timezone` - Set user timezone manually
- `POST /api/timezone/detect` - Store browser-detected timezone

### Frontend Components

#### 1. `lib/timezoneClient.ts`
Client-side timezone utilities:
- **Browser Detection**: Detects timezone using `Intl.DateTimeFormat`
- **Backend Communication**: Sends/receives timezone to/from backend
- **Timestamp Formatting**: Formats timestamps in user's timezone
- **Initialization**: Auto-detects and sends timezone on app load

Key Functions:
```typescript
detectBrowserTimezone(): UserTimezoneInfo
initializeTimezone(): Promise<void>
formatTimestampInTimezone(timestamp: Date | string, timezone?: string): string
```

#### 2. `hooks/useTimezone.ts`
React hook for timezone management:
- Automatically detects and initializes timezone on mount
- Provides timezone information and formatting functions
- Allows manual timezone updates
- Handles loading and error states

Usage:
```typescript
const { timezone, formatTimestamp, updateTimezone } = useTimezone();
```

#### 3. `components/TimezoneDisplay.tsx`
UI components for displaying timezone information:
- `TimezoneDisplay` - Shows current timezone and detection method
- `TimestampDisplay` - Displays timestamps in user's timezone

## Data Flow

### 1. Initial Timezone Detection
```
Browser → detectBrowserTimezone() → POST /api/timezone/detect → Session Storage
```

### 2. Weather Data Request
```
Frontend → Backend API → getUserTimezone(req) → Weather API (with timezone) → Validate → Response
```

### 3. Timestamp Display
```
Backend Timestamp → Frontend → formatTimestampInTimezone() → User's Local Time
```

## Usage Examples

### Backend: Fetch Weather with Timezone

```typescript
import { fetchCurrentWeather } from './services/weatherService';

// In an Express route handler
app.get('/api/weather', async (req, res) => {
  const { latitude, longitude } = req.query;
  
  // Automatically uses user's timezone from session
  const weather = await fetchCurrentWeather(
    Number(latitude),
    Number(longitude),
    req // Pass request for timezone
  );
  
  if (!weather) {
    return res.status(404).json({ error: 'Weather data not available' });
  }
  
  res.json(weather);
});
```

### Backend: Validate Weather Data with Timezone

```typescript
import WeatherValidator from './utils/weatherValidator';

const validator = new WeatherValidator();

const rawData = {
  temperature: 25,
  relativeHumidity: 80,
  windSpeed: 5,
  dewPoint: 20,
  timestamp: '2024-01-15T12:00:00',
  timezone: 'America/New_York'
};

// Validates timezone and throws error if invalid
const validated = validator.validate(rawData);
```

### Backend: Calculate Daylight Hours

```typescript
import { isDaylightHour, convertToTimezone } from './utils/timezoneUtils';

const timestamp = new Date('2024-01-15T14:00:00Z');
const timezone = 'America/New_York';
const latitude = 40.7128; // New York

const daylightInfo = isDaylightHour(timestamp, timezone, latitude);
console.log(daylightInfo.isDaylight); // true or false
console.log(daylightInfo.hour); // Local hour (0-23)
```

### Frontend: Initialize Timezone

```typescript
// In App.tsx or main component
import { useEffect } from 'react';
import { initializeTimezone } from './lib/timezoneClient';

function App() {
  useEffect(() => {
    // Auto-detect and send timezone to backend
    initializeTimezone();
  }, []);
  
  return <div>...</div>;
}
```

### Frontend: Display Timestamps

```typescript
import { TimestampDisplay } from './components/TimezoneDisplay';

function WeatherDisplay({ weather }) {
  return (
    <div>
      <TimestampDisplay 
        timestamp={weather.observedAt}
        label="Observed at"
      />
    </div>
  );
}
```

### Frontend: Use Timezone Hook

```typescript
import { useTimezone } from './hooks/useTimezone';

function MyComponent() {
  const { timezone, formatTimestamp, updateTimezone } = useTimezone();
  
  return (
    <div>
      <p>Current timezone: {timezone}</p>
      <p>Weather observed: {formatTimestamp(weatherData.timestamp)}</p>
      <button onClick={() => updateTimezone('Europe/London')}>
        Switch to London time
      </button>
    </div>
  );
}
```

## Integration with Disease Risk Calculations

The timezone handling is critical for accurate disease risk calculations, particularly for leaf wetness duration:

```typescript
import { isDaylightHour } from './utils/timezoneUtils';

function calculateLeafWetness(hourlyWeather: ValidatedWeatherData[]): number {
  let wetnessHours = 0;
  
  for (const hour of hourlyWeather) {
    // Use timezone-aware daylight detection
    const daylightInfo = isDaylightHour(
      hour.timestamp,
      hour.timezone,
      latitude
    );
    
    // Base wetness from humidity
    if (hour.relativeHumidity && hour.relativeHumidity >= 90) {
      wetnessHours += 1;
    }
    
    // Apply daylight evaporation factor
    if (daylightInfo.isDaylight && hour.relativeHumidity && hour.relativeHumidity < 95) {
      wetnessHours *= 0.7; // Reduced wetness during daylight
    }
    
    // Wind speed reduction
    if (hour.windSpeed && hour.windSpeed > 3) {
      wetnessHours *= 0.8;
    }
  }
  
  return wetnessHours;
}
```

## Testing

### Unit Tests
- Test timezone validation with valid/invalid timezones
- Test timezone conversion with various offsets
- Test daylight detection at different hours
- Test weather API parameter creation

### Integration Tests
- Test timezone detection and storage flow
- Test weather data fetching with timezone
- Test timestamp display in different timezones

## Error Handling

### Invalid Timezone
```typescript
const validation = validateTimezone('Invalid/Timezone');
if (!validation.isValid) {
  console.error(validation.error); // "Invalid timezone: Invalid/Timezone"
}
```

### Missing Timezone
```typescript
// WeatherValidator throws error if timezone is invalid
try {
  const validated = validator.validate(rawData);
} catch (error) {
  console.error('Invalid timestamp or timezone combination');
}
```

### Fallback Behavior
- If browser detection fails → defaults to UTC
- If backend timezone not available → uses 'auto' for weather API
- If timezone validation fails → defaults to UTC with warning

## Performance Considerations

1. **Session Storage**: Timezone is stored in session, avoiding repeated detection
2. **Validation Caching**: Timezone validation uses native `Intl.DateTimeFormat` (fast)
3. **Lazy Initialization**: Frontend only initializes timezone once on app load
4. **Minimal API Calls**: Timezone is sent to backend only once per session

## Security Considerations

1. **Input Validation**: All timezone inputs are validated before use
2. **Session-based Storage**: Timezone is stored in secure HTTP-only session cookie
3. **No Client-side Manipulation**: Weather API timezone is determined server-side
4. **IANA Timezone Database**: Uses standard IANA timezone identifiers

## Future Enhancements

1. **Geolocation-based Detection**: Use GPS coordinates to determine timezone
2. **Sunrise/Sunset Calculation**: Use libraries like `suncalc` for accurate daylight hours
3. **Timezone Selection UI**: Allow users to manually select timezone from dropdown
4. **Timezone History**: Track timezone changes for debugging
5. **DST Handling**: Enhanced handling of daylight saving time transitions
