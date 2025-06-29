import axios from 'axios';
import { OptimizationRequest, Job, Technician } from '../../types/optimization.types';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3009';
const HANKO_URL = process.env.HANKO_URL || 'http://localhost:8000';

describe('Route4SSM E2E API Tests', () => {
  let authToken: string;
  let testJobId: string;
  let testTechnicianId: string;

  // Test data
  const testJob: Job = {
    id: 'test-job-001',
    address: '123 Test Street, Perth WA 6000',
    coordinates: { latitude: -31.9505, longitude: 115.8605 },
    time_window: { start: '09:00', end: '17:00' },
    service_time: 60,
    priority: 1,
    job_type: 'READ'
  };

  const testTechnician: Technician = {
    id: 'test-tech-001',
    name: 'John Test',
    home_address: '456 Home Street, Perth WA 6000',
    home_coordinates: { latitude: -31.9505, longitude: 115.8605 },
    working_hours: { start: '08:00', end: '18:00' },
    skills: ['READ']
  };

  const optimizationRequest: OptimizationRequest = {
    depot: {
      name: 'Test Depot',
      address: '789 Depot Street, Perth WA 6000',
      coordinates: { latitude: -31.9505, longitude: 115.8605 }
    },
    jobs: [testJob],
    technicians: [testTechnician]
  };

  beforeAll(async () => {
    // Mock authentication - in real scenario, you'd get a token from Hanko
    authToken = 'mock-auth-token';
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${API_BASE_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: 'healthy',
        service: 'route4ssm-api'
      });
      expect(response.data.timestamp).toBeDefined();
    });
  });

  describe('Job Management', () => {
    it('should create a new job', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/jobs`, testJob, {
        headers: { 'x-auth-token': authToken }
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        address: testJob.address,
        coordinates: testJob.coordinates,
        time_window: testJob.time_window,
        service_time: testJob.service_time,
        priority: testJob.priority,
        job_type: testJob.job_type,
        status: 'pending'
      });

      testJobId = response.data.id;
    });

    it('should retrieve the created job', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/jobs/${testJobId}`, {
        headers: { 'x-auth-token': authToken }
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testJobId);
      expect(response.data.address).toBe(testJob.address);
    });

    it('should list jobs with filters', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/jobs?status=pending&job_type=READ`, {
        headers: { 'x-auth-token': authToken }
      });

      expect(response.status).toBe(200);
      expect(response.data.jobs).toBeInstanceOf(Array);
      expect(response.data.total).toBeGreaterThan(0);
    });
  });

  describe('Technician Management', () => {
    it('should create a new technician', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/technicians`, testTechnician, {
        headers: { 'x-auth-token': authToken }
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        name: testTechnician.name,
        home_address: testTechnician.home_address,
        home_coordinates: testTechnician.home_coordinates,
        working_hours: testTechnician.working_hours,
        skills: testTechnician.skills,
        is_active: true
      });

      testTechnicianId = response.data.id;
    });

    it('should retrieve the created technician', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/technicians/${testTechnicianId}`, {
        headers: { 'x-auth-token': authToken }
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(testTechnicianId);
      expect(response.data.name).toBe(testTechnician.name);
    });
  });

  describe('Route Optimization', () => {
    it('should create an optimization job', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/route-optimization`, optimizationRequest, {
        headers: { 'x-auth-token': authToken }
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        status: 'queued',
        message: 'Optimization job created successfully'
      });
      expect(response.data.jobId).toBeDefined();

      const jobId = response.data.jobId;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const statusResponse = await axios.get(`${API_BASE_URL}/api/route-optimization/status/${jobId}`, {
          headers: { 'x-auth-token': authToken }
        });

        if (statusResponse.data.status === 'completed') {
          break;
        } else if (statusResponse.data.status === 'failed') {
          throw new Error(`Optimization failed: ${statusResponse.data.failedReason}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;
      }

      // Get the result
      const resultResponse = await axios.get(`${API_BASE_URL}/api/route-optimization/result/${jobId}`, {
        headers: { 'x-auth-token': authToken }
      });

      expect(resultResponse.status).toBe(200);
      expect(resultResponse.data.status).toBe('completed');
      expect(resultResponse.data.result).toBeDefined();
      expect(resultResponse.data.result.routes).toBeInstanceOf(Array);
      expect(resultResponse.data.result.summary).toBeDefined();
    });

    it('should handle invalid optimization request', async () => {
      const invalidRequest = {
        depot: { name: 'Invalid Depot' }, // Missing required fields
        jobs: [], // Empty jobs array
        technicians: [] // Empty technicians array
      };

      try {
        await axios.post(`${API_BASE_URL}/api/route-optimization`, invalidRequest, {
          headers: { 'x-auth-token': authToken }
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('At least one job is required');
      }
    });

    it('should handle non-existent job status request', async () => {
      const nonExistentJobId = 'non-existent-id';

      try {
        await axios.get(`${API_BASE_URL}/api/route-optimization/status/${nonExistentJobId}`, {
          headers: { 'x-auth-token': authToken }
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toContain('Optimization job not found');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/jobs`);
        fail('Should have thrown an authentication error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.error).toContain('No token provided');
      }
    });

    it('should handle invalid job ID format', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/jobs/invalid-uuid`, {
          headers: { 'x-auth-token': authToken }
        });
        fail('Should have thrown a validation error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent optimization requests', async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const request = {
          ...optimizationRequest,
          jobs: [{ ...testJob, id: `concurrent-job-${i}` }]
        };

        promises.push(
          axios.post(`${API_BASE_URL}/api/route-optimization`, request, {
            headers: { 'x-auth-token': authToken }
          })
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.data.jobId).toBeDefined();
      });
    });

    it('should complete optimization within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(`${API_BASE_URL}/api/route-optimization`, optimizationRequest, {
        headers: { 'x-auth-token': authToken }
      });

      const jobId = response.data.jobId;
      let completed = false;
      let attempts = 0;
      const maxAttempts = 15; // 30 seconds max

      while (!completed && attempts < maxAttempts) {
        const statusResponse = await axios.get(`${API_BASE_URL}/api/route-optimization/status/${jobId}`, {
          headers: { 'x-auth-token': authToken }
        });

        if (statusResponse.data.status === 'completed') {
          completed = true;
        } else if (statusResponse.data.status === 'failed') {
          throw new Error(`Optimization failed: ${statusResponse.data.failedReason}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(completed).toBe(true);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
}); 