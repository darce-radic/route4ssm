import { OptimizationAlgorithmService } from '../../services/optimization/optimizationAlgorithm.service';
import { OptimizationRequest, Job, Technician } from '../../types/optimization.types';

describe('Optimization Service Integration Tests', () => {
  let optimizationService: OptimizationAlgorithmService;

  beforeEach(() => {
    optimizationService = new OptimizationAlgorithmService();
  });

  describe('Complete Optimization Workflow', () => {
    it('should optimize a simple route with one job and one technician', async () => {
      const job: Job = {
        id: 'job-1',
        address: '123 Test St, Perth WA 6000',
        coordinates: { latitude: -31.9505, longitude: 115.8605 },
        time_window: { start: '09:00', end: '17:00' },
        service_time: 60,
        priority: 1,
        job_type: 'READ'
      };

      const technician: Technician = {
        id: 'tech-1',
        name: 'John Doe',
        home_address: '456 Home St, Perth WA 6000',
        home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
        working_hours: { start: '08:00', end: '18:00' },
        skills: ['READ']
      };

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '789 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs: [job],
        technicians: [technician]
      };

      const result = await optimizationService.optimize(request);

      // Verify the result structure
      expect(result).toBeDefined();
      expect(result.optimization_id).toBeDefined();
      expect(result.routes).toBeInstanceOf(Array);
      expect(result.routes).toHaveLength(1);
      expect(result.summary).toBeDefined();

      // Verify the route details
      const route = result.routes[0];
      expect(route.technician_id).toBe(technician.id);
      expect(route.total_distance).toBeGreaterThan(0);
      expect(route.total_time).toBeGreaterThan(0);
      expect(route.stops).toBeInstanceOf(Array);
      expect(route.stops.length).toBeGreaterThan(0);

      // Verify summary statistics
      expect(result.summary.total_jobs).toBe(1);
      expect(result.summary.total_routes).toBe(1);
      expect(result.summary.total_distance).toBeGreaterThan(0);
      expect(result.summary.total_time).toBeGreaterThan(0);
      expect(result.summary.optimization_score).toBe(1.0);
    });

    it('should handle multiple jobs with time window constraints', async () => {
      const jobs: Job[] = [
        {
          id: 'job-1',
          address: '123 Test St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 },
          time_window: { start: '09:00', end: '12:00' },
          service_time: 60,
          priority: 1,
          job_type: 'READ'
        },
        {
          id: 'job-2',
          address: '456 Test St, Perth WA 6000',
          coordinates: { latitude: -31.9605, longitude: 115.8705 },
          time_window: { start: '13:00', end: '17:00' },
          service_time: 45,
          priority: 2,
          job_type: 'READ'
        }
      ];

      const technician: Technician = {
        id: 'tech-1',
        name: 'John Doe',
        home_address: '789 Home St, Perth WA 6000',
        home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
        working_hours: { start: '08:00', end: '18:00' },
        skills: ['READ']
      };

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '999 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs,
        technicians: [technician]
      };

      const result = await optimizationService.optimize(request);

      expect(result.summary.total_jobs).toBe(2);
      expect(result.routes[0].stops.length).toBeGreaterThan(2); // depot + 2 jobs + return to depot
    });

    it('should respect priority ordering', async () => {
      const jobs: Job[] = [
        {
          id: 'low-priority',
          address: '123 Test St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 },
          time_window: { start: '09:00', end: '17:00' },
          service_time: 30,
          priority: 3, // Lower priority
          job_type: 'READ'
        },
        {
          id: 'high-priority',
          address: '456 Test St, Perth WA 6000',
          coordinates: { latitude: -31.9605, longitude: 115.8705 }, // Different coordinates
          time_window: { start: '09:00', end: '17:00' },
          service_time: 30,
          priority: 1, // Higher priority
          job_type: 'READ'
        }
      ];

      const technician: Technician = {
        id: 'tech-1',
        name: 'John Doe',
        home_address: '789 Home St, Perth WA 6000',
        home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
        working_hours: { start: '08:00', end: '18:00' },
        skills: ['READ']
      };

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '999 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs,
        technicians: [technician]
      };

      const result = await optimizationService.optimize(request);

      // Both jobs should be assigned
      expect(result.summary.total_jobs).toBe(2);
      
      // The high priority job should be scheduled first
      const route = result.routes[0];
      const jobStops = route.stops.filter(stop => stop.type === 'job');
      expect(jobStops[0].job_id).toBe('high-priority');
    });

    it('should handle jobs outside working hours', async () => {
      const jobs: Job[] = [
        {
          id: 'within-hours',
          address: '123 Test St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 },
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 1,
          job_type: 'READ'
        },
        {
          id: 'outside-hours',
          address: '456 Test St, Perth WA 6000',
          coordinates: { latitude: -31.9605, longitude: 115.8705 }, // Different coordinates
          time_window: { start: '20:00', end: '22:00' }, // Outside working hours
          service_time: 60,
          priority: 1,
          job_type: 'READ'
        }
      ];

      const technician: Technician = {
        id: 'tech-1',
        name: 'John Doe',
        home_address: '789 Home St, Perth WA 6000',
        home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
        working_hours: { start: '08:00', end: '18:00' },
        skills: ['READ']
      };

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '999 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs,
        technicians: [technician]
      };

      const result = await optimizationService.optimize(request);

      // Only the job within working hours should be assigned
      expect(result.summary.total_jobs).toBe(1);
      expect(result.summary.optimization_score).toBe(0.5);
    });

    it('should handle multiple technicians efficiently', async () => {
      const jobs: Job[] = [
        {
          id: 'job-1',
          address: '123 Test St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 },
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 1,
          job_type: 'READ'
        },
        {
          id: 'job-2',
          address: '456 Test St, Perth WA 6000',
          coordinates: { latitude: -31.9605, longitude: 115.8705 },
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 1,
          job_type: 'READ'
        }
      ];

      const technicians: Technician[] = [
        {
          id: 'tech-1',
          name: 'John Doe',
          home_address: '789 Home St, Perth WA 6000',
          home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        },
        {
          id: 'tech-2',
          name: 'Jane Smith',
          home_address: '999 Home St, Perth WA 6000',
          home_coordinates: { latitude: -31.9505, longitude: 115.8605 },
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        }
      ];

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '111 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs,
        technicians
      };

      const result = await optimizationService.optimize(request);

      // Both jobs should be assigned
      expect(result.summary.total_jobs).toBe(2);
      expect(result.summary.total_routes).toBe(2);
      expect(result.summary.optimization_score).toBe(1.0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty jobs array', async () => {
      const technician: Technician = {
        id: 'tech-1',
        name: 'John Doe',
        home_address: '123 Home St, Perth WA 6000',
        home_coordinates: { latitude: -31.9505, longitude: 115.8605 },
        working_hours: { start: '08:00', end: '18:00' },
        skills: ['READ']
      };

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '456 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs: [],
        technicians: [technician]
      };

      const result = await optimizationService.optimize(request);

      expect(result.summary.total_jobs).toBe(0);
      expect(result.summary.total_routes).toBe(0);
      expect(result.summary.optimization_score).toBe(0);
    });

    it('should handle empty technicians array', async () => {
      const job: Job = {
        id: 'job-1',
        address: '123 Test St, Perth WA 6000',
        coordinates: { latitude: -31.9505, longitude: 115.8605 },
        time_window: { start: '09:00', end: '17:00' },
        service_time: 60,
        priority: 1,
        job_type: 'READ'
      };

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '456 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs: [job],
        technicians: []
      };

      const result = await optimizationService.optimize(request);

      expect(result.summary.total_jobs).toBe(0);
      expect(result.summary.total_routes).toBe(0);
      expect(result.summary.optimization_score).toBe(0);
    });

    it('should handle jobs with very short time windows', async () => {
      const job: Job = {
        id: 'short-window',
        address: '123 Test St, Perth WA 6000',
        coordinates: { latitude: -31.9505, longitude: 115.8605 },
        time_window: { start: '10:00', end: '10:30' }, // Very short window
        service_time: 60, // Service time longer than window
        priority: 1,
        job_type: 'READ'
      };

      const technician: Technician = {
        id: 'tech-1',
        name: 'John Doe',
        home_address: '456 Home St, Perth WA 6000',
        home_coordinates: { latitude: -31.9505, longitude: 115.8605 },
        working_hours: { start: '08:00', end: '18:00' },
        skills: ['READ']
      };

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '789 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs: [job],
        technicians: [technician]
      };

      const result = await optimizationService.optimize(request);

      // Job should not be assigned due to impossible time constraints
      expect(result.summary.total_jobs).toBe(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of jobs efficiently', async () => {
      const jobs: Job[] = [];
      for (let i = 0; i < 50; i++) {
        jobs.push({
          id: `job-${i}`,
          address: `${i} Test St, Perth WA 6000`,
          coordinates: { 
            latitude: -31.9505 + (Math.random() - 0.5) * 0.1, 
            longitude: 115.8605 + (Math.random() - 0.5) * 0.1 
          },
          time_window: { start: '09:00', end: '17:00' },
          service_time: 30,
          priority: Math.floor(Math.random() * 5) + 1,
          job_type: 'READ'
        });
      }

      const technicians: Technician[] = [
        {
          id: 'tech-1',
          name: 'John Doe',
          home_address: '123 Home St, Perth WA 6000',
          home_coordinates: { latitude: -31.9505, longitude: 115.8605 },
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        },
        {
          id: 'tech-2',
          name: 'Jane Smith',
          home_address: '456 Home St, Perth WA 6000',
          home_coordinates: { latitude: -31.9505, longitude: 115.8605 },
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        }
      ];

      const request: OptimizationRequest = {
        depot: {
          name: 'Main Depot',
          address: '789 Depot St, Perth WA 6000',
          coordinates: { latitude: -31.9505, longitude: 115.8605 }
        },
        jobs,
        technicians
      };

      const startTime = Date.now();
      const result = await optimizationService.optimize(request);
      const endTime = Date.now();

      expect(result.summary.total_jobs).toBeGreaterThan(0);
      expect(result.summary.total_routes).toBe(2);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
}); 