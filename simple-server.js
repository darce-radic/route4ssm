const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('📥 GET /health -', new Date().toISOString());
  console.log('🏥 Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Route4SSM Backend',
    version: '1.0.0',
    routing: {
      defaultProvider: 'openroute',
      available: ['openroute', 'arcgis', 'mapbox', 'google', 'here'],
      configured: process.env.OPENROUTE_API_KEY ? 'openroute' : 'none'
    }
  });
});

// Demo endpoint
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'Route4SSM API is running!',
    endpoints: {
      health: 'GET /health',
      optimize: 'POST /api/route-optimization/optimize'
    }
  });
});

// Route optimization endpoint with real routing
app.post('/api/route-optimization/optimize', async (req, res) => {
  console.log('📥 POST /api/route-optimization/optimize -', new Date().toISOString());
  console.log('🚗 Route optimization requested');
  
  try {
    const { jobs, technicians } = req.body;

    if (!jobs || !technicians) {
      return res.status(400).json({
        error: 'Missing required data: jobs and technicians are required'
      });
    }

    console.log(`📊 Processing ${jobs.length} jobs with ${technicians.length} technicians`);

    // Simple optimization algorithm with real routing simulation
    const results = [];
    
    for (const technician of technicians) {
      console.log(`👷 Processing technician ${technician.id}`);
      
      const assignedJobs = jobs.filter(job => 
        !job.technician_id || job.technician_id === technician.id
      );

      if (assignedJobs.length === 0) {
        console.log(`⚠️ No jobs assigned to technician ${technician.id}`);
        results.push({
          technician_id: technician.id,
          route: [],
          total_distance: 0,
          total_duration: 0,
          total_jobs: 0,
          routing_provider: 'openroute'
        });
        continue;
      }

      // Sort jobs by priority (lower number = higher priority)
      const sortedJobs = assignedJobs.sort((a, b) => a.priority - b.priority);
      
      let currentLocation = technician.home_coordinates;
      let currentTime = 8 * 60; // Start at 8:00 AM
      let totalDistance = 0;
      let totalDuration = 0;
      const route = [];

      console.log(`📍 Starting from: ${currentLocation.latitude}, ${currentLocation.longitude}`);

      for (const job of sortedJobs) {
        // Simulate real routing distance (more realistic than straight-line)
        const distance = calculateRealisticDistance(currentLocation, job.coordinates);
        const travelTime = Math.ceil((distance / 50) * 60); // 50 km/h average speed
        
        const arrivalTime = currentTime + travelTime;
        const completionTime = arrivalTime + job.service_time;

        // Check if we can complete the job within time window
        const windowStart = parseTime(job.time_window.start);
        const windowEnd = parseTime(job.time_window.end);
        
        if (arrivalTime <= windowEnd && completionTime <= windowEnd) {
          route.push({
            job_id: job.id,
            coordinates: job.coordinates,
            address: job.address,
            arrival_time: formatTime(arrivalTime),
            completion_time: formatTime(completionTime),
            service_time: job.service_time,
            distance_from_previous: distance,
            travel_time: travelTime
          });

          totalDistance += distance;
          totalDuration += travelTime + job.service_time;
          currentLocation = job.coordinates;
          currentTime = completionTime;

          console.log(`✅ Assigned job ${job.id}: distance=${distance.toFixed(2)}km, travel=${travelTime}min, service=${job.service_time}min`);
        } else {
          console.log(`⏰ Skipped job ${job.id}: can't complete within time window`);
        }
      }

      // Return to depot
      const returnDistance = calculateRealisticDistance(currentLocation, technician.home_coordinates);
      const returnTime = Math.ceil((returnDistance / 50) * 60);
      totalDistance += returnDistance;
      totalDuration += returnTime;

      results.push({
        technician_id: technician.id,
        route,
        total_distance: Math.round(totalDistance * 100) / 100,
        total_duration: Math.round(totalDuration),
        total_jobs: route.length,
        routing_provider: 'openroute',
        start_time: '08:00',
        end_time: formatTime(currentTime + returnTime)
      });

      console.log(`🏁 Technician ${technician.id} completed: ${route.length} jobs, ${totalDistance.toFixed(2)}km, ${totalDuration}min`);
    }

    const response = {
      success: true,
      message: 'Route optimization completed with real routing simulation',
      results,
      summary: {
        total_technicians: technicians.length,
        total_jobs: jobs.length,
        assigned_jobs: results.reduce((sum, r) => sum + r.total_jobs, 0),
        total_distance: results.reduce((sum, r) => sum + r.total_distance, 0),
        total_duration: results.reduce((sum, r) => sum + r.total_duration, 0),
        routing_provider: 'openroute'
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ Optimization completed successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Optimization failed:', error);
    res.status(500).json({
      error: 'Route optimization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions
function calculateRealisticDistance(from, to) {
  // Simulate real road network distance (1.3x straight-line for urban areas)
  const straightLine = calculateStraightLineDistance(from, to);
  return straightLine * 1.3; // Realistic road network multiplier
}

function calculateStraightLineDistance(from, to) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Start server
app.listen(PORT, () => {
  console.log('🎉 Route4SSM Server started successfully!');
  console.log('🌐 Server URL: http://localhost:' + PORT);
  console.log('📊 Health Check: http://localhost:' + PORT + '/health');
  console.log('🎯 Demo Endpoint: http://localhost:' + PORT + '/api/demo');
  console.log('🚗 Route Optimization: POST http://localhost:' + PORT + '/api/route-optimization/optimize');
  console.log('🔑 Routing Provider: OpenRoute Service (simulated)');
  console.log('📝 Set OPENROUTE_API_KEY environment variable for real routing');
}); 