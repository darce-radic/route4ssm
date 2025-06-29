import { logger } from '../../utils/logger';
import {
  OptimizationRequest,
  OptimizationResult,
  Job,
  Technician,
  Route,
  RouteStop,
  TimeWindow,
} from '../../types/optimization.types';

export class OptimizationAlgorithmService {
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private isTimeWithinWindow(time: number, window: TimeWindow): boolean {
    const start = this.parseTime(window.start);
    const end = this.parseTime(window.end);
    return time >= start && time <= end;
  }

  private findNearestJob(
    currentLat: number,
    currentLon: number,
    jobs: Job[],
    currentTime: number,
    technician: Technician
  ): Job | null {
    let nearestJob: Job | null = null;
    let minDistance = Infinity;

    for (const job of jobs) {
      // Skip if job requires skills the technician doesn't have
      if (job.technician_id && job.technician_id !== technician.id) {
        continue;
      }

      const distance = this.calculateDistance(
        currentLat,
        currentLon,
        job.coordinates.latitude,
        job.coordinates.longitude
      );

      // Estimate arrival time (assuming 50 km/h average speed)
      const travelTime = (distance / 50) * 60; // Convert to minutes
      const arrivalTime = currentTime + travelTime;

      // Skip if arrival time is outside job's time window
      if (!this.isTimeWithinWindow(arrivalTime, job.time_window)) {
        continue;
      }

      if (distance < minDistance) {
        minDistance = distance;
        nearestJob = job;
      }
    }

    return nearestJob;
  }

  private async optimizeRoute(
    technician: Technician,
    availableJobs: Job[],
    startLocation: { latitude: number; longitude: number }
  ): Promise<Route> {
    const route: Route = {
      technician_id: technician.id,
      total_distance: 0,
      total_time: 0,
      total_service_time: 0,
      stops: [],
    };

    let currentTime = this.parseTime(technician.working_hours.start);
    let currentLat = startLocation.latitude;
    let currentLon = startLocation.longitude;
    let remainingJobs = [...availableJobs];
    let sequence = 1;

    // Add starting depot
    route.stops.push({
      sequence: 0,
      type: 'depot',
      location: {
        address: technician.home_address,
        coordinates: technician.home_coordinates,
      },
      planned_arrival: technician.working_hours.start,
      planned_departure: technician.working_hours.start,
    });

    while (remainingJobs.length > 0) {
      const nextJob = this.findNearestJob(
        currentLat,
        currentLon,
        remainingJobs,
        currentTime,
        technician
      );

      if (!nextJob) break;

      const distance = this.calculateDistance(
        currentLat,
        currentLon,
        nextJob.coordinates.latitude,
        nextJob.coordinates.longitude
      );

      const travelTime = Math.ceil((distance / 50) * 60); // Convert to minutes
      const arrivalTime = currentTime + travelTime;

      // Wait if arrived before time window starts
      const jobStartTime = this.parseTime(nextJob.time_window.start);
      const actualStartTime = Math.max(arrivalTime, jobStartTime);

      const stop: RouteStop = {
        sequence,
        type: 'job',
        job_id: nextJob.id,
        location: {
          address: nextJob.address,
          coordinates: nextJob.coordinates,
        },
        planned_arrival: this.formatTime(arrivalTime),
        planned_departure: this.formatTime(actualStartTime + nextJob.service_time),
        service_time: nextJob.service_time,
        travel_time_from_previous: travelTime,
      };

      route.stops.push(stop);
      route.total_distance += distance;
      route.total_time += travelTime + nextJob.service_time;
      route.total_service_time += nextJob.service_time;

      currentTime = actualStartTime + nextJob.service_time;
      currentLat = nextJob.coordinates.latitude;
      currentLon = nextJob.coordinates.longitude;
      sequence++;

      // Remove assigned job
      remainingJobs = remainingJobs.filter(job => job.id !== nextJob.id);

      // Break if we exceed working hours
      if (currentTime >= this.parseTime(technician.working_hours.end)) {
        break;
      }
    }

    // Add return to depot
    const finalDistance = this.calculateDistance(
      currentLat,
      currentLon,
      technician.home_coordinates.latitude,
      technician.home_coordinates.longitude
    );

    const finalTravelTime = Math.ceil((finalDistance / 50) * 60);
    const returnTime = currentTime + finalTravelTime;

    route.stops.push({
      sequence,
      type: 'depot',
      location: {
        address: technician.home_address,
        coordinates: technician.home_coordinates,
      },
      planned_arrival: this.formatTime(returnTime),
      planned_departure: this.formatTime(returnTime),
      travel_time_from_previous: finalTravelTime,
    });

    route.total_distance += finalDistance;
    route.total_time += finalTravelTime;

    return route;
  }

  public async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    const { jobs, technicians } = request;
    const routes: Route[] = [];
    let unassignedJobs = [...jobs];

    // Sort jobs by priority (highest first)
    unassignedJobs.sort((a, b) => b.priority - a.priority);

    // Optimize route for each technician
    for (const technician of technicians) {
      if (unassignedJobs.length === 0) break;

      const availableJobs = unassignedJobs.filter(job => 
        !job.technician_id || job.technician_id === technician.id
      );

      if (availableJobs.length === 0) continue;

      const route = await this.optimizeRoute(
        technician,
        availableJobs,
        technician.home_coordinates
      );

      routes.push(route);

      // Remove assigned jobs
      const assignedJobIds = route.stops
        .filter(stop => stop.type === 'job')
        .map(stop => stop.job_id!);
      unassignedJobs = unassignedJobs.filter(job => !assignedJobIds.includes(job.id));
    }

    // Calculate summary statistics
    const summary = {
      total_jobs: jobs.length - unassignedJobs.length,
      total_routes: routes.length,
      total_distance: routes.reduce((sum, route) => sum + route.total_distance, 0),
      total_time: routes.reduce((sum, route) => sum + route.total_time, 0),
      optimization_score: (jobs.length - unassignedJobs.length) / jobs.length,
    };

    logger.info('Optimization completed', {
      totalJobs: jobs.length,
      assignedJobs: jobs.length - unassignedJobs.length,
      unassignedJobs: unassignedJobs.length,
      routes: routes.length,
    });

    return {
      optimization_id: request.options?.optimization_time_limit?.toString() || 'default',
      routes,
      summary,
    };
  }
} 