export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TimeWindow {
  start: string;  // Format: "HH:mm"
  end: string;    // Format: "HH:mm"
}

export interface Depot {
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface Job {
  id: string;
  client_ref?: string;
  address: string;
  coordinates: Coordinates;
  time_window: TimeWindow;
  service_time: number;  // in minutes
  priority: number;      // 1-5
  job_type: string;
  technician_id?: string;
}

export interface Technician {
  id: string;
  name: string;
  home_address: string;
  home_coordinates: Coordinates;
  working_hours: TimeWindow;
  skills: string[];
  max_jobs_per_day?: number;
}

export interface OptimizationOptions {
  optimization_time_limit?: number;  // in seconds
  prefer_provider?: string;
  avoid_tolls?: boolean;
  include_traffic?: boolean;
}

export interface OptimizationRequest {
  depot: Depot;
  jobs: Job[];
  technicians: Technician[];
  options?: OptimizationOptions;
}

export interface RouteStop {
  sequence: number;
  type: 'depot' | 'job';
  job_id?: string;
  location: {
    address: string;
    coordinates: Coordinates;
  };
  planned_arrival: string;    // Format: "HH:mm"
  planned_departure: string;  // Format: "HH:mm"
  service_time?: number;      // in minutes
  travel_time_from_previous?: number;  // in minutes
}

export interface Route {
  technician_id: string;
  total_distance: number;     // in kilometers
  total_time: number;         // in minutes
  total_service_time: number; // in minutes
  stops: RouteStop[];
  geometry?: string;          // encoded polyline
}

export interface OptimizationResult {
  optimization_id: string;
  routes: Route[];
  summary: {
    total_jobs: number;
    total_routes: number;
    total_distance: number;
    total_time: number;
    optimization_score: number;
  };
} 