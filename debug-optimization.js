const { OptimizationAlgorithmService } = require('./dist/src/services/optimization/optimizationAlgorithm.service');

// Mock data
const mockJob = {
  id: 'job-1',
  address: '123 Test St, Perth WA 6000',
  coordinates: { latitude: -31.9505, longitude: 115.8605 },
  time_window: { start: '09:00', end: '17:00' },
  service_time: 60,
  priority: 1,
  job_type: 'READ'
};

const mockTechnician = {
  id: 'tech-1',
  name: 'John Doe',
  home_address: '456 Home St, Perth WA 6000',
  home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
  working_hours: { start: '08:00', end: '18:00' },
  skills: ['READ']
};

const mockRequest = {
  depot: {
    name: 'Main Depot',
    address: '789 Depot St, Perth WA 6000',
    coordinates: { latitude: -31.9505, longitude: 115.8605 }
  },
  jobs: [mockJob],
  technicians: [mockTechnician]
};

async function debugOptimization() {
  console.log('=== DEBUG OPTIMIZATION START ===');
  console.log('Mock job:', JSON.stringify(mockJob, null, 2));
  console.log('Mock technician:', JSON.stringify(mockTechnician, null, 2));
  
  try {
    const service = new OptimizationAlgorithmService();
    const result = await service.optimize(mockRequest);
    
    console.log('=== OPTIMIZATION RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('=== ANALYSIS ===');
    console.log('Total jobs assigned:', result.summary.total_jobs);
    console.log('Total routes created:', result.summary.total_routes);
    console.log('Routes with job stops:', result.routes.filter(r => r.stops.some(s => s.type === 'job')).length);
    
    if (result.routes.length > 0) {
      const route = result.routes[0];
      console.log('First route stops:', route.stops.map(s => ({ type: s.type, job_id: s.job_id })));
    }
    
  } catch (error) {
    console.error('Error during optimization:', error);
  }
}

debugOptimization(); 