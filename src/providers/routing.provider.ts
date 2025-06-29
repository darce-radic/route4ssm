import axios from 'axios';
import { logger } from '../utils/logger';
import { Coordinates } from '../types/optimization.types';

export class RoutingProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTE_API_KEY || '';
    this.baseUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
  }

  async getRoute(
    start: Coordinates,
    end: Coordinates
  ) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          start: `${start.longitude},${start.latitude}`,
          end: `${end.longitude},${end.latitude}`,
        },
      });

      return {
        distance: response.data.features[0].properties.segments[0].distance,
        duration: response.data.features[0].properties.segments[0].duration,
        geometry: response.data.features[0].geometry,
      };
    } catch (error) {
      logger.error('Error getting route from OpenRouteService:', error);
      throw new Error('Failed to get route from routing service');
    }
  }

  async getDistanceMatrix(
    locations: Coordinates[]
  ): Promise<{ distances: number[][]; durations: number[][] }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/matrix/driving-car`,
        {
          locations: locations.map(loc => [loc.longitude, loc.latitude]),
          metrics: ['distance', 'duration'],
        },
        {
          headers: {
            'Authorization': this.apiKey,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        distances: response.data.distances,  // in meters
        durations: response.data.durations,  // in seconds
      };
    } catch (error) {
      logger.error('Error getting distance matrix from OpenRouteService', {
        locationCount: locations.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to get distance matrix from routing provider');
    }
  }
} 