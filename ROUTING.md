# Route4SSM Routing Service

## Overview

The Route4SSM application now includes a **real road network routing service** that can use multiple routing providers to calculate accurate distances and travel times instead of straight-line distances.

## Supported Routing Providers

### 1. OpenRoute Service (Default)
- **Free tier available**: 2,000 requests/day
- **API Key**: Get from [OpenRoute Service](https://openrouteservice.org/dev/#/signup)
- **Features**: Driving, walking, cycling, public transport
- **Coverage**: Global

### 2. ArcGIS Routing Service
- **API Key**: Get from [ArcGIS Developer](https://developers.arcgis.com/)
- **Features**: Advanced routing with traffic, tolls, restrictions
- **Coverage**: Global

### 3. Mapbox Directions API
- **API Key**: Get from [Mapbox](https://account.mapbox.com/access-tokens/)
- **Features**: Driving, walking, cycling, optimized trips
- **Coverage**: Global

### 4. Google Maps Directions API
- **API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/)
- **Features**: Comprehensive routing with traffic
- **Coverage**: Global

### 5. HERE Routing API
- **API Key**: Get from [HERE Developer Portal](https://developer.here.com/)
- **Features**: Advanced routing with real-time traffic
- **Coverage**: Global

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Default: OpenRoute Service (free tier available)
OPENROUTE_API_KEY=your-openroute-api-key-here

# Backup/Alternative Routing Services
ARCGIS_API_KEY=your-arcgis-api-key-here
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token-here
GOOGLE_API_KEY=your-google-api-key-here
HERE_API_KEY=your-here-api-key-here

# Server Configuration
PORT=3009
NODE_ENV=development
```

### Configuration File

The routing configuration is defined in `src/config/routing.config.ts`:

```typescript
export const routingConfig: RoutingConfig = {
  defaultProvider: 'openroute',
  providers: {
    openroute: {
      apiKey: process.env.OPENROUTE_API_KEY || 'your-openroute-api-key-here',
      baseUrl: 'https://api.openrouteservice.org/v2/directions'
    },
    // ... other providers
  }
};
```

## Usage

### Basic Route Calculation

```typescript
import { RoutingService } from './src/services/routing/routingService';
import { routingConfig } from './src/config/routing.config';

const routingService = new RoutingService(routingConfig);

// Get route between two points
const route = await routingService.getRoute({
  waypoints: [
    { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    { latitude: 37.3382, longitude: -121.8863 }  // San Jose
  ],
  profile: 'driving-car'
});

console.log(`Distance: ${(route.distance / 1000).toFixed(2)} km`);
console.log(`Duration: ${(route.duration / 60).toFixed(2)} minutes`);
```

### Distance and Travel Time

```typescript
// Get distance between two points
const distance = await routingService.getDistance(
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.3382, longitude: -121.8863 }
);

// Get travel time between two points
const duration = await routingService.getTravelTime(
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.3382, longitude: -121.8863 }
);
```

### Provider Selection

```typescript
// Use specific provider
const route = await routingService.getRoute(request, 'mapbox');

// Available providers: 'openroute', 'arcgis', 'mapbox', 'google', 'here'
```

## Integration with Optimization

The routing service is automatically integrated into the optimization algorithm:

1. **Real Distances**: Uses actual road network distances instead of straight-line
2. **Real Travel Times**: Calculates realistic travel times based on road conditions
3. **Fallback**: Falls back to straight-line distance if routing service fails
4. **Provider Flexibility**: Can switch between providers based on availability

## Testing

Run the routing service tests:

```bash
npm test -- src/services/routing/routingService.test.ts
```

The tests will:
- Test route calculation with OpenRoute Service
- Test distance and travel time calculations
- Provide fallback behavior if API keys are not configured

## API Response Format

```typescript
interface RouteResponse {
  distance: number;        // in meters
  duration: number;        // in seconds
  geometry?: any;          // GeoJSON geometry
  waypoints?: Coordinate[];
  legs?: RouteLeg[];
  provider: string;        // 'openroute', 'arcgis', etc.
  success: boolean;
  error?: string;
}
```

## Error Handling

The routing service includes robust error handling:

1. **API Failures**: Falls back to straight-line distance calculation
2. **Provider Failures**: Falls back to default provider
3. **Network Issues**: Graceful degradation with estimated times
4. **Invalid Coordinates**: Clear error messages

## Performance Considerations

- **Caching**: Consider implementing route caching for repeated requests
- **Rate Limits**: Respect API provider rate limits
- **Batch Requests**: Use batch optimization for multiple routes
- **Async Processing**: All routing calls are asynchronous

## Getting Started

1. **Get API Key**: Sign up for OpenRoute Service (free)
2. **Set Environment**: Add your API key to `.env` file
3. **Test**: Run the routing tests to verify connectivity
4. **Deploy**: The service will automatically use real routing

## Cost Optimization

- **OpenRoute**: Free tier (2,000 requests/day)
- **Caching**: Cache frequently requested routes
- **Provider Selection**: Use cheaper providers for non-critical routes
- **Batch Optimization**: Minimize API calls through efficient algorithms

## Troubleshooting

### Common Issues

1. **API Key Not Set**: Service falls back to straight-line distances
2. **Rate Limit Exceeded**: Implement request throttling
3. **Network Issues**: Check internet connectivity
4. **Invalid Coordinates**: Verify coordinate format (latitude, longitude)

### Debug Mode

Enable debug logging:

```typescript
// In your application
process.env.DEBUG = 'routing:*';
```

## Next Steps

- [ ] Implement route caching
- [ ] Add traffic-aware routing
- [ ] Support for multiple transport modes
- [ ] Real-time traffic integration
- [ ] Route optimization with multiple waypoints 