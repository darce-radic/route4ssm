import { logger } from '../../utils/logger';
import { RoutingService } from '../routing/routingService';
import { routingConfig } from '../../config/routing.config';
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
  private routingService: RoutingService;

  constructor() {
    this.routingService = new RoutingService(routingConfig);
    logger.info('Optimization algorithm service initialized with real routing');
  }

  private async calculateDistance(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): Promise<number> {
    try {
      const distance = await this.routingService.getDistance(from, to);
      return distance / 1000; // Convert meters to kilometers
    } catch (error) {
      logger.warn('Routing service failed, falling back to straight-line distance', { error: (error as Error).message });
      // Fallback to straight-line distance if routing fails
      return this.calculateStraightLineDistance(from, to);
    }
  }

  private calculateStraightLineDistance(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.latitude - from.latitude);
    const dLon = this.toRad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.latitude)) * Math.cos(this.toRad(to.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async calculateTravelTime(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): Promise<number> {
    try {
      const duration = await this.routingService.getTravelTime(from, to);
      return duration / 60; // Convert seconds to minutes
    } catch (error) {
      logger.warn('Routing service failed, estimating travel time from distance', { error: (error as Error).message });
      // Fallback: estimate 50 km/h average speed
      const distance = this.calculateStraightLineDistance(from, to);
      return (distance / 50) * 60; // Convert to minutes
    }
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

  private async findNearestJob(
    currentLat: number,
    currentLon: number,
    jobs: Job[],
    currentTime: number,
    technician: Technician
  ): Promise<Job | null> {
    let bestJob: Job | null = null;
    let bestPriority = Infinity;
    let bestDistance = Infinity;

    console.log(`🔍 Finding best job for technician ${technician.id} at time ${currentTime} (${this.formatTime(currentTime)})`);
    console.log(`📋 Available jobs: ${jobs.length}`);

    for (const job of jobs) {
      // Skip if job is specifically assigned to a different technician
      if (job.technician_id && job.technician_id !== technician.id) {
        console.log(`⏭️  Skipping job ${job.id} - assigned to different technician`);
        continue;
      }

      const distance = await this.calculateDistance(
        { latitude: currentLat, longitude: currentLon },
        { latitude: job.coordinates.latitude, longitude: job.coordinates.longitude }
      );

      // Get real travel time from routing service
      const travelTime = await this.calculateTravelTime(
        { latitude: currentLat, longitude: currentLon },
        { latitude: job.coordinates.latitude, longitude: job.coordinates.longitude }
      );
      
      const arrivalTime = currentTime + travelTime;

      console.log(`📍 Job ${job.id}: priority=${job.priority}, distance=${distance.toFixed(2)}km, travelTime=${travelTime.toFixed(2)}min, arrivalTime=${arrivalTime} (${this.formatTime(arrivalTime)})`);

      // Check if we can make it before the job's time window ends
      const windowEnd = this.parseTime(job.time_window.end);
      if (arrivalTime > windowEnd) {
        console.log(`⏰ Skipping job ${job.id} - can't make it before window ends (arrival: ${this.formatTime(arrivalTime)}, window ends: ${job.time_window.end})`);
        continue;
      }

      // Check if we can complete the job within its time window
      const completionTime = arrivalTime + job.service_time;
      if (completionTime > windowEnd) {
        console.log(`⏰ Skipping job ${job.id} - can't complete within time window (completion: ${this.formatTime(completionTime)}, window ends: ${job.time_window.end}, service time: ${job.service_time}min)`);
        continue;
      }

      // Additional check: ensure the time window is long enough for the service
      const windowStart = this.parseTime(job.time_window.start);
      const windowDuration = windowEnd - windowStart;
      if (job.service_time > windowDuration) {
        console.log(`⏰ Skipping job ${job.id} - service time (${job.service_time}min) longer than time window (${windowDuration}min)`);
        continue;
      }

      // Check if job's time window is outside technician's working hours
      const jobStartTime = this.parseTime(job.time_window.start);
      const jobEndTime = this.parseTime(job.time_window.end);
      const workingStartTime = this.parseTime(technician.working_hours.start);
      const workingEndTime = this.parseTime(technician.working_hours.end);
      
      if (jobStartTime >= workingEndTime || jobEndTime <= workingStartTime) {
        console.log(`🕐 Skipping job ${job.id} - time window outside working hours (job: ${job.time_window.start}-${job.time_window.end}, work: ${technician.working_hours.start}-${technician.working_hours.end})`);
        continue;
      }

      // Skip if arrival time is outside technician's working hours
      if (arrivalTime >= workingEndTime) {
        console.log(`🕐 Skipping job ${job.id} - arrival outside working hours (arrival: ${this.formatTime(arrivalTime)}, work ends: ${technician.working_hours.end})`);
        continue;
      }

      // Check if this job is better than the current best
      // Priority is the primary factor (higher priority = better)
      // Distance is the secondary factor (shorter distance = better)
      if (job.priority < bestPriority || 
          (job.priority === bestPriority && distance < bestDistance)) {
        bestPriority = job.priority;
        bestDistance = distance;
        bestJob = job;
        console.log(`✅ Found better job: ${job.id} (priority: ${job.priority}, distance: ${distance.toFixed(2)}km)`);
      }
    }

    console.log(`🎯 Selected job: ${bestJob?.id || 'none'} (priority: ${bestJob?.priority || 'N/A'})`);
    return bestJob;
  }

  private async optimizeRoute(
    technician: Technician,
    availableJobs: Job[],
    startLocation: { latitude: number; longitude: number }
  ): Promise<Route> {
    console.log(`🚗 Starting route optimization for technician ${technician.id}`);
    console.log(`📍 Starting location: ${startLocation.latitude}, ${startLocation.longitude}`);
    console.log(`📋 Available jobs: ${availableJobs.length}`);

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
    // Sort jobs by priority (lowest number = highest priority) to ensure priority ordering
    let remainingJobs = [...availableJobs].sort((a, b) => a.priority - b.priority);
    let sequence = 1;

    console.log(`⏰ Starting time: ${this.formatTime(currentTime)} (${technician.working_hours.start})`);
    console.log(`📋 Jobs sorted by priority:`, remainingJobs.map(j => `${j.id}(priority:${j.priority})`));

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

    console.log(`🏠 Added depot stop at sequence 0`);

    while (remainingJobs.length > 0) {
      console.log(`\n🔄 Route building iteration ${sequence}:`);
      console.log(`📋 Remaining jobs: ${remainingJobs.length}`);
      console.log(`⏰ Current time: ${this.formatTime(currentTime)}`);
      console.log(`📍 Current location: ${currentLat}, ${currentLon}`);

      // Process jobs in priority order (lowest number = highest priority)
      // Find the highest priority job that can be assigned from current location
      let nextJob: Job | null = null;
      let jobIndex = -1;

      for (let i = 0; i < remainingJobs.length; i++) {
        const job = remainingJobs[i];
        
        // Skip if job is specifically assigned to a different technician
        if (job.technician_id && job.technician_id !== technician.id) {
          console.log(`⏭️  Skipping job ${job.id} - assigned to different technician`);
          continue;
        }

        const distance = await this.calculateDistance(
          { latitude: currentLat, longitude: currentLon },
          { latitude: job.coordinates.latitude, longitude: job.coordinates.longitude }
        );

        // Get real travel time from routing service
        const travelTime = await this.calculateTravelTime(
          { latitude: currentLat, longitude: currentLon },
          { latitude: job.coordinates.latitude, longitude: job.coordinates.longitude }
        );
        
        const arrivalTime = currentTime + travelTime;

        console.log(`📍 Job ${job.id}: priority=${job.priority}, distance=${distance.toFixed(2)}km, travelTime=${travelTime.toFixed(2)}min, arrivalTime=${arrivalTime} (${this.formatTime(arrivalTime)})`);

        // Check if we can make it before the job's time window ends
        const windowEnd = this.parseTime(job.time_window.end);
        if (arrivalTime > windowEnd) {
          console.log(`⏰ Skipping job ${job.id} - can't make it before window ends (arrival: ${this.formatTime(arrivalTime)}, window ends: ${job.time_window.end})`);
          continue;
        }

        // Check if we can complete the job within its time window
        const completionTime = arrivalTime + job.service_time;
        if (completionTime > windowEnd) {
          console.log(`⏰ Skipping job ${job.id} - can't complete within time window (completion: ${this.formatTime(completionTime)}, window ends: ${job.time_window.end}, service time: ${job.service_time}min)`);
          continue;
        }

        // Additional check: ensure the time window is long enough for the service
        const windowStart = this.parseTime(job.time_window.start);
        const windowDuration = windowEnd - windowStart;
        if (job.service_time > windowDuration) {
          console.log(`⏰ Skipping job ${job.id} - service time (${job.service_time}min) longer than time window (${windowDuration}min)`);
          continue;
        }

        // Check if job's time window is outside technician's working hours
        const jobStartTime = this.parseTime(job.time_window.start);
        const jobEndTime = this.parseTime(job.time_window.end);
        const workingStartTime = this.parseTime(technician.working_hours.start);
        const workingEndTime = this.parseTime(technician.working_hours.end);
        
        if (jobStartTime >= workingEndTime || jobEndTime <= workingStartTime) {
          console.log(`🕐 Skipping job ${job.id} - time window outside working hours (job: ${job.time_window.start}-${job.time_window.end}, work: ${technician.working_hours.start}-${technician.working_hours.end})`);
          continue;
        }

        // Skip if arrival time is outside technician's working hours
        if (arrivalTime >= workingEndTime) {
          console.log(`🕐 Skipping job ${job.id} - arrival outside working hours (arrival: ${this.formatTime(arrivalTime)}, work ends: ${technician.working_hours.end})`);
          continue;
        }

        // This job can be assigned - select it (highest priority first)
        nextJob = job;
        jobIndex = i;
        console.log(`✅ Selected job: ${job.id} (priority: ${job.priority})`);
        break; // Take the first valid job (highest priority due to sorting)
      }

      if (!nextJob) {
        console.log(`❌ No suitable job found, ending route optimization`);
        break;
      }

      const distance = await this.calculateDistance(
        { latitude: currentLat, longitude: currentLon },
        { latitude: nextJob.coordinates.latitude, longitude: nextJob.coordinates.longitude }
      );

      const travelTime = await this.calculateTravelTime(
        { latitude: currentLat, longitude: currentLon },
        { latitude: nextJob.coordinates.latitude, longitude: nextJob.coordinates.longitude }
      );

      const arrivalTime = currentTime + travelTime;

      // Wait if arrived before time window starts
      const jobStartTime = this.parseTime(nextJob.time_window.start);
      const actualStartTime = Math.max(arrivalTime, jobStartTime);

      console.log(`📊 Job ${nextJob.id} details:`);
      console.log(`   Distance: ${distance.toFixed(2)}km`);
      console.log(`   Travel time: ${travelTime.toFixed(2)}min`);
      console.log(`   Arrival time: ${this.formatTime(arrivalTime)}`);
      console.log(`   Job window: ${nextJob.time_window.start}-${nextJob.time_window.end}`);
      console.log(`   Actual start: ${this.formatTime(actualStartTime)} (waited: ${actualStartTime - arrivalTime}min)`);

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

      console.log(`✅ Added job stop: ${nextJob.id} at sequence ${sequence}`);
      console.log(`📊 Route totals: distance=${route.total_distance.toFixed(2)}km, time=${route.total_time}min`);

      currentTime = actualStartTime + nextJob.service_time;
      currentLat = nextJob.coordinates.latitude;
      currentLon = nextJob.coordinates.longitude;
      sequence++;

      // Remove assigned job
      remainingJobs = remainingJobs.filter(job => job.id !== nextJob.id);

      // Break if we exceed working hours
      if (currentTime >= this.parseTime(technician.working_hours.end)) {
        console.log(`⏰ Reached working hours end (${technician.working_hours.end}), stopping route optimization`);
        break;
      }
    }

    // Add return to depot
    const finalDistance = await this.calculateDistance(
      { latitude: currentLat, longitude: currentLon },
      technician.home_coordinates
    );

    const finalTravelTime = await this.calculateTravelTime(
      { latitude: currentLat, longitude: currentLon },
      technician.home_coordinates
    );
    const returnTime = currentTime + finalTravelTime;

    console.log(`🏠 Adding return to depot:`);
    console.log(`   Distance: ${finalDistance.toFixed(2)}km`);
    console.log(`   Travel time: ${finalTravelTime.toFixed(2)}min`);
    console.log(`   Return time: ${this.formatTime(returnTime)}`);

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

    console.log(`✅ Route optimization completed for technician ${technician.id}`);
    console.log(`📊 Final route: ${route.stops.length} stops, ${route.total_distance.toFixed(2)}km, ${route.total_time}min`);
    console.log(`📋 Job stops: ${route.stops.filter(s => s.type === 'job').length}`);

    return route;
  }

  public async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    const { jobs, technicians } = request;
    const routes: Route[] = [];
    let unassignedJobs = [...jobs];

    console.log('\n🚀 === OPTIMIZATION START ===');
    console.log(`📊 Input Summary:`);
    console.log(`   Jobs: ${jobs.length}`);
    console.log(`   Technicians: ${technicians.length}`);
    console.log(`   Depot: ${request.depot.name} (${request.depot.address})`);

    // Log jobs table
    console.log('\n📋 Jobs:');
    console.table(jobs.map(job => ({
      id: job.id,
      address: job.address,
      time_window: `${job.time_window.start}-${job.time_window.end}`,
      service_time: `${job.service_time}min`,
      priority: job.priority,
      technician_id: job.technician_id || 'unassigned'
    })));

    // Log technicians table
    console.log('\n👷 Technicians:');
    console.table(technicians.map(tech => ({
      id: tech.id,
      name: tech.name,
      working_hours: `${tech.working_hours.start}-${tech.working_hours.end}`,
      skills: tech.skills.join(', '),
      home_address: tech.home_address
    })));

    // Sort jobs by priority (lowest number = highest priority)
    unassignedJobs.sort((a, b) => a.priority - b.priority);
    console.log(`\n📋 Jobs sorted by priority (lowest first):`, unassignedJobs.map(j => j.id));

    // Optimize route for each technician
    for (const technician of technicians) {
      console.log(`\n👷 Processing technician: ${technician.id} (${technician.name})`);
      
      const availableJobs = unassignedJobs.filter(job => 
        !job.technician_id || job.technician_id === technician.id
      );

      console.log(`📋 Available jobs for ${technician.id}: ${availableJobs.length}`);
      if (availableJobs.length > 0) {
        console.log(`   Job IDs:`, availableJobs.map(j => j.id));
      }

      // Only create a route if there are jobs to assign
      if (availableJobs.length > 0) {
        const route = await this.optimizeRoute(
          technician,
          availableJobs,
          technician.home_coordinates
        );
        
        if (route.stops.length > 1) { // More than just depot
          routes.push(route);
          let assignedJobsCount = 0;
          
          // Remove assigned jobs from unassigned list
          const assignedJobIds = route.stops
            .filter(stop => stop.type === 'job')
            .map(stop => stop.job_id!);
          unassignedJobs = unassignedJobs.filter(job => !assignedJobIds.includes(job.id));
          
          console.log(`✅ Route created for ${technician.id}: ${assignedJobIds.length} job stops`);
          console.log(`📋 Remaining unassigned jobs: ${unassignedJobs.length}`);
        }
      }
    }

    // Calculate summary statistics
    const summary = {
      total_jobs: jobs.length - unassignedJobs.length,
      total_routes: routes.length,
      total_distance: routes.reduce((sum, route) => sum + route.total_distance, 0),
      total_time: routes.reduce((sum, route) => sum + route.total_time, 0),
      optimization_score: jobs.length > 0 ? (jobs.length - unassignedJobs.length) / jobs.length : 0,
    };

    console.log('\n📊 === OPTIMIZATION END ===');
    console.log('📈 Summary:');
    console.table([{
      'Total Jobs': summary.total_jobs,
      'Total Routes': summary.total_routes,
      'Total Distance (km)': summary.total_distance.toFixed(2),
      'Total Time (min)': summary.total_time,
      'Optimization Score': (summary.optimization_score * 100).toFixed(1) + '%'
    }]);

    if (unassignedJobs.length > 0) {
      console.log('\n⚠️  Unassigned Jobs:');
      console.table(unassignedJobs.map(job => ({
        id: job.id,
        address: job.address,
        time_window: `${job.time_window.start}-${job.time_window.end}`,
        priority: job.priority,
        reason: 'Could not be assigned within constraints'
      })));
    }

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