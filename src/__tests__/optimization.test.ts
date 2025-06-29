import { OptimizationAlgorithmService } from '../services/optimization/optimizationAlgorithm.service';
import { OptimizationRequest, Job, Technician } from '../types/optimization.types';

describe('OptimizationAlgorithmService', () => {
  let service: OptimizationAlgorithmService;

  beforeEach(() => {
    service = new OptimizationAlgorithmService();
  });

  const mockJob: Job = {
    id: 'job-1',
    address: '123 Test St, Perth WA 6000',
    coordinates: { latitude: -31.9505, longitude: 115.8605 },
    time_window: { start: '09:00', end: '17:00' },
    service_time: 60,
    priority: 1,
    job_type: 'READ'
  };

  const mockTechnician: Technician = {
    id: 'tech-1',
    name: 'John Doe',
    home_address: '456 Home St, Perth WA 6000',
    home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
    working_hours: { start: '08:00', end: '18:00' },
    skills: ['READ']
  };

  const mockRequest: OptimizationRequest = {
    depot: {
      name: 'Main Depot',
      address: '789 Depot St, Perth WA 6000',
      coordinates: { latitude: -31.9505, longitude: 115.8605 }
    },
    jobs: [mockJob],
    technicians: [mockTechnician]
  };

  describe('optimize', () => {
    it('should debug optimization logic', async () => {
      console.log('Starting debug test');
      console.log('Mock job:', mockJob);
      console.log('Mock technician:', mockTechnician);
      
      const result = await service.optimize(mockRequest);
      
      console.log('Optimization result:', JSON.stringify(result, null, 2));
      
      expect(result).toBeDefined();
    });

    it('should return a valid optimization result', async () => {
      const result = await service.optimize(mockRequest);

      expect(result).toBeDefined();
      expect(result.optimization_id).toBeDefined();
      expect(result.routes).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
      expect(result.summary.total_jobs).toBeGreaterThan(0);
    });

    it('should handle empty jobs array', async () => {
      const emptyRequest = { ...mockRequest, jobs: [] };
      
      const result = await service.optimize(emptyRequest);
      
      expect(result.summary.total_jobs).toBe(0);
      expect(result.routes).toHaveLength(0);
    });

    it('should handle empty technicians array', async () => {
      const emptyRequest = { ...mockRequest, technicians: [] };
      
      const result = await service.optimize(emptyRequest);
      
      expect(result.summary.total_jobs).toBe(0);
      expect(result.routes).toHaveLength(0);
    });

    it('should respect time window constraints', async () => {
      const jobOutsideWindow: Job = {
        ...mockJob,
        id: 'job-2',
        time_window: { start: '20:00', end: '22:00' } // Outside working hours
      };

      const request = { ...mockRequest, jobs: [mockJob, jobOutsideWindow] };
      const result = await service.optimize(request);

      // Should only assign jobs within working hours
      expect(result.summary.total_jobs).toBe(1);
    });
  });
}); 