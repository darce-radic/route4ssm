const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Get backend URL from environment or default to localhost
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3009';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'route4ssm-web-client',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    backend_url: BACKEND_URL
  });
});

// API proxy for development (in production, nginx handles this)
app.use('/api', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}${req.url}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Backend service unavailable' });
  }
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('🎉 Route4SSM Web Client started successfully!');
  console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Backend: ${BACKEND_URL}`);
  console.log('📋 Available Features:');
  console.log('   • Interactive ArcGIS Map');
  console.log('   • Route Optimization Testing');
  console.log('   • Multiple Test Scenarios');
  console.log('   • Real-time Visualization');
  console.log('   • Priority-based Scheduling');
  console.log('   • Time Window Constraints');
  console.log('   • Multi-Technician Support');
}); 