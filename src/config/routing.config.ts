import { RoutingConfig } from '../services/routing/routingService';

export const routingConfig: RoutingConfig = {
  defaultProvider: 'openroute',
  providers: {
    openroute: {
      apiKey: process.env.OPENROUTE_API_KEY || 'your-openroute-api-key-here',
      baseUrl: 'https://api.openrouteservice.org/v2/directions'
    },
    arcgis: {
      apiKey: process.env.ARCGIS_API_KEY || '',
      baseUrl: 'https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World'
    },
    mapbox: {
      accessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
      baseUrl: 'https://api.mapbox.com/directions/v5'
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY || '',
      baseUrl: 'https://maps.googleapis.com/maps/api/directions/json'
    },
    here: {
      apiKey: process.env.HERE_API_KEY || '',
      baseUrl: 'https://router.hereapi.com/v8/routes'
    }
  }
}; 