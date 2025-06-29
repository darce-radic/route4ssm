import { logger } from '../../utils/logger';
import { routingConfig } from '../../config/routing.config';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteRequest {
  waypoints: Coordinate[];
  profile?: string; // driving, walking, cycling
  avoid?: string[]; // tolls, highways, ferries
  optimize?: boolean; // optimize waypoint order
}

export interface RouteResponse {
  distance: number; // in meters
  duration: number; // in seconds
  geometry?: any; // GeoJSON geometry
  waypoints?: Coordinate[];
  legs?: RouteLeg[];
  provider: string;
  success: boolean;
  error?: string;
}

export interface RouteLeg {
  distance: number;
  duration: number;
  geometry?: any;
}

export interface RoutingConfig {
  defaultProvider: 'openroute' | 'arcgis' | 'mapbox' | 'google' | 'here';
  providers: {
    openroute?: {
      apiKey: string;
      baseUrl?: string;
    };
    arcgis?: {
      apiKey: string;
      baseUrl?: string;
    };
    mapbox?: {
      accessToken: string;
      baseUrl?: string;
    };
    google?: {
      apiKey: string;
      baseUrl?: string;
    };
    here?: {
      apiKey: string;
      baseUrl?: string;
    };
  };
}

// Type definitions for API responses
interface OpenRouteResponse {
  features?: Array<{
    properties?: {
      summary?: {
        distance?: number;
        duration?: number;
      };
      segments?: Array<{
        distance?: number;
        duration?: number;
      }>;
    };
    geometry?: any;
  }>;
}

interface ArcGISResponse {
  error?: {
    message?: string;
  };
  routes?: {
    features?: Array<{
      attributes?: {
        Total_Length?: number;
        Total_Time?: number;
      };
      geometry?: any;
    }>;
  };
}

interface MapboxResponse {
  code?: string;
  message?: string;
  trips?: Array<{
    distance?: number;
    duration?: number;
    geometry?: any;
  }>;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: any;
  }>;
}

interface GoogleResponse {
  status?: string;
  error_message?: string;
  routes?: Array<{
    legs?: Array<{
      distance?: {
        value?: number;
      };
      duration?: {
        value?: number;
      };
    }>;
  }>;
}

interface HereResponse {
  routes?: Array<{
    sections?: Array<{
      summary?: {
        length?: number;
        duration?: number;
      };
    }>;
  }>;
}

export class RoutingService {
  private config: RoutingConfig;

  constructor(config: RoutingConfig) {
    this.config = config;
    logger.info('Routing service initialized', { defaultProvider: config.defaultProvider });
  }

  async getRoute(request: RouteRequest, provider?: string): Promise<RouteResponse> {
    const targetProvider = provider || this.config.defaultProvider;
    
    try {
      logger.info('Getting route', { provider: targetProvider, waypoints: request.waypoints.length });
      
      switch (targetProvider) {
        case 'openroute':
          return await this.getOpenRouteRoute(request);
        case 'arcgis':
          return await this.getArcGISRoute(request);
        case 'mapbox':
          return await this.getMapboxRoute(request);
        case 'google':
          return await this.getGoogleRoute(request);
        case 'here':
          return await this.getHereRoute(request);
        default:
          throw new Error(`Unsupported routing provider: ${targetProvider}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Routing failed', { provider: targetProvider, error: errorMessage });
      
      // Fallback to default provider if different from current
      if (provider && provider !== this.config.defaultProvider) {
        logger.info('Falling back to default provider', { fallback: this.config.defaultProvider });
        return await this.getRoute(request, this.config.defaultProvider);
      }
      
      return {
        distance: 0,
        duration: 0,
        provider: targetProvider,
        success: false,
        error: errorMessage
      };
    }
  }

  private async getOpenRouteRoute(request: RouteRequest): Promise<RouteResponse> {
    const config = this.config.providers.openroute;
    if (!config?.apiKey) {
      throw new Error('OpenRoute API key not configured');
    }

    const baseUrl = config.baseUrl || 'https://api.openrouteservice.org/v2/directions';
    const profile = request.profile || 'driving-car';
    
    const coordinates = request.waypoints.map(wp => [wp.longitude, wp.latitude]);
    
    const response = await fetch(`${baseUrl}/${profile}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates,
        format: 'geojson',
        instructions: false,
        preference: request.optimize ? 'fastest' : 'recommended'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRoute API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as OpenRouteResponse;
    
    if (!data.features || data.features.length === 0) {
      throw new Error('No route found');
    }

    const feature = data.features[0];
    const properties = feature.properties;
    const segments = properties?.segments || [];

    return {
      distance: properties?.summary?.distance || 0,
      duration: properties?.summary?.duration || 0,
      geometry: feature.geometry,
      waypoints: request.waypoints,
      legs: segments.map((segment) => ({
        distance: segment.distance || 0,
        duration: segment.duration || 0
      })),
      provider: 'openroute',
      success: true
    };
  }

  private async getArcGISRoute(request: RouteRequest): Promise<RouteResponse> {
    const config = this.config.providers.arcgis;
    if (!config?.apiKey) {
      throw new Error('ArcGIS API key not configured');
    }

    const baseUrl = config.baseUrl || 'https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World';
    
    const params = new URLSearchParams({
      f: 'json',
      token: config.apiKey,
      stops: request.waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join(';'),
      returnDirections: 'true',
      returnRoutes: 'true',
      outputLines: 'esriNAOutputLineTrueShape'
    });

    const response = await fetch(`${baseUrl}/solve?${params}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ArcGIS API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as ArcGISResponse;
    
    if (data.error) {
      throw new Error(`ArcGIS API error: ${data.error.message || 'Unknown error'}`);
    }

    const route = data.routes?.features?.[0];
    if (!route) {
      throw new Error('No route found');
    }

    const attributes = route.attributes;
    
    return {
      distance: (attributes?.Total_Length || 0) * 1000, // Convert km to meters
      duration: (attributes?.Total_Time || 0) * 60, // Convert minutes to seconds
      geometry: route.geometry,
      waypoints: request.waypoints,
      provider: 'arcgis',
      success: true
    };
  }

  private async getMapboxRoute(request: RouteRequest): Promise<RouteResponse> {
    const config = this.config.providers.mapbox;
    if (!config?.accessToken) {
      throw new Error('Mapbox access token not configured');
    }

    const baseUrl = config.baseUrl || 'https://api.mapbox.com/directions/v5';
    const profile = request.profile || 'mapbox/driving';
    
    const coordinates = request.waypoints.map(wp => `${wp.longitude},${wp.latitude}`).join(';');
    const optimize = request.optimize ? 'true' : 'false';
    
    const params = new URLSearchParams({
      access_token: config.accessToken,
      geometries: 'geojson',
      overview: 'full',
      steps: 'false',
      annotations: 'distance,duration'
    });

    if (request.optimize && request.waypoints.length > 2) {
      // Use optimization API for multiple waypoints
      const optimizationUrl = `https://api.mapbox.com/optimized-trips/v1/${profile}/${coordinates}`;
      const optParams = new URLSearchParams({
        access_token: config.accessToken,
        geometries: 'geojson',
        overview: 'full',
        steps: 'false'
      });

      const response = await fetch(`${optimizationUrl}?${optParams}`);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Mapbox API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as MapboxResponse;
      
      if (data.code !== 'Ok') {
        throw new Error(`Mapbox API error: ${data.message || 'Unknown error'}`);
      }

      return {
        distance: data.trips?.[0]?.distance || 0,
        duration: data.trips?.[0]?.duration || 0,
        geometry: data.trips?.[0]?.geometry,
        waypoints: request.waypoints,
        provider: 'mapbox',
        success: true
      };
    } else {
      // Use regular directions API
      const response = await fetch(`${baseUrl}/${profile}/${coordinates}?${params}`);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Mapbox API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as MapboxResponse;
      
      if (data.code !== 'Ok') {
        throw new Error(`Mapbox API error: ${data.message || 'Unknown error'}`);
      }

      const route = data.routes?.[0];
      if (!route) {
        throw new Error('No route found');
      }

      return {
        distance: route.distance || 0,
        duration: route.duration || 0,
        geometry: route.geometry,
        waypoints: request.waypoints,
        provider: 'mapbox',
        success: true
      };
    }
  }

  private async getGoogleRoute(request: RouteRequest): Promise<RouteResponse> {
    const config = this.config.providers.google;
    if (!config?.apiKey) {
      throw new Error('Google API key not configured');
    }

    const baseUrl = config.baseUrl || 'https://maps.googleapis.com/maps/api/directions/json';
    
    const params = new URLSearchParams({
      key: config.apiKey,
      origin: `${request.waypoints[0].latitude},${request.waypoints[0].longitude}`,
      destination: `${request.waypoints[request.waypoints.length - 1].latitude},${request.waypoints[request.waypoints.length - 1].longitude}`,
      waypoints: request.waypoints.slice(1, -1).map(wp => `${wp.latitude},${wp.longitude}`).join('|'),
      optimize: request.optimize ? 'true' : 'false'
    });

    const response = await fetch(`${baseUrl}?${params}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as GoogleResponse;
    
    if (data.status !== 'OK') {
      throw new Error(`Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    const route = data.routes?.[0];
    if (!route) {
      throw new Error('No route found');
    }

    const legs = route.legs || [];
    const totalDistance = legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
    const totalDuration = legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);

    return {
      distance: totalDistance,
      duration: totalDuration,
      waypoints: request.waypoints,
      legs: legs.map(leg => ({
        distance: leg.distance?.value || 0,
        duration: leg.duration?.value || 0
      })),
      provider: 'google',
      success: true
    };
  }

  private async getHereRoute(request: RouteRequest): Promise<RouteResponse> {
    const config = this.config.providers.here;
    if (!config?.apiKey) {
      throw new Error('HERE API key not configured');
    }

    const baseUrl = config.baseUrl || 'https://router.hereapi.com/v8/routes';
    
    const params = new URLSearchParams({
      apiKey: config.apiKey,
      transportMode: 'car',
      origin: `${request.waypoints[0].latitude},${request.waypoints[0].longitude}`,
      destination: `${request.waypoints[request.waypoints.length - 1].latitude},${request.waypoints[request.waypoints.length - 1].longitude}`,
      via: request.waypoints.slice(1, -1).map(wp => `${wp.latitude},${wp.longitude}`).join('!'),
      return: 'summary,polyline'
    });

    const response = await fetch(`${baseUrl}?${params}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HERE API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as HereResponse;
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const sections = route.sections || [];
    const totalDistance = sections.reduce((sum, section) => sum + (section.summary?.length || 0), 0);
    const totalDuration = sections.reduce((sum, section) => sum + (section.summary?.duration || 0), 0);

    return {
      distance: totalDistance,
      duration: totalDuration,
      waypoints: request.waypoints,
      provider: 'here',
      success: true
    };
  }

  // Utility method to get distance between two points using any provider
  async getDistance(from: Coordinate, to: Coordinate, provider?: string): Promise<number> {
    const route = await this.getRoute({
      waypoints: [from, to],
      profile: 'driving'
    }, provider);
    
    return route.distance;
  }

  // Utility method to get travel time between two points using any provider
  async getTravelTime(from: Coordinate, to: Coordinate, provider?: string): Promise<number> {
    const route = await this.getRoute({
      waypoints: [from, to],
      profile: 'driving'
    }, provider);
    
    return route.duration;
  }
} 