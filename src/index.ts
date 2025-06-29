import express from 'express';
import cors from 'cors';
import { setupRoutes } from './routes';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import 'dotenv/config';

console.log('🚀 Starting Route4SSM API Server...');
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

const app = express();
const port = process.env.PORT || 3009;

console.log(`🔧 Server Configuration:`);
console.log(`   Port: ${port}`);
console.log(`   CORS: Enabled`);
console.log(`   JSON Body Parser: Enabled`);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log(`   Headers:`, Object.keys(req.headers).filter(h => h.startsWith('x-') || h === 'authorization' || h === 'content-type'));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log(`🏥 Health check requested`);
  const healthData = { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'route4ssm-api',
    version: process.env.npm_package_version || '1.0.0'
  };
  console.log(`   Health data:`, healthData);
  res.status(200).json(healthData);
});

// Demo endpoint with mock data
app.get('/api/demo', (req, res) => {
  console.log(`🎯 Demo endpoint requested`);
  const demoData = {
    message: 'Route4SSM API is running successfully!',
    features: [
      'Route optimization algorithm',
      'Priority-based job scheduling',
      'Time window constraints',
      'Multi-technician support',
      'Real-time optimization scoring'
    ],
    status: 'operational',
    timestamp: new Date().toISOString()
  };
  res.status(200).json(demoData);
});

console.log('🛣️  Setting up API routes...');

// Setup routes (will work with mock data)
try {
  setupRoutes(app);
  console.log('✅ API routes configured');
} catch (error) {
  console.log('⚠️  Some routes may not work without database - using demo mode');
}

// Error handling middleware (must be last)
app.use(errorHandler);
console.log('✅ Error handling middleware configured');

// Start server
app.listen(port, () => {
  console.log('🎉 Server started successfully!');
  console.log(`🌐 Server URL: http://localhost:${port}`);
  console.log(`📊 Health Check: http://localhost:${port}/health`);
  console.log(`🎯 Demo Endpoint: http://localhost:${port}/api/demo`);
  console.log(`📝 API Documentation: Available at /api endpoints`);
  logger.info(`Server is running on port ${port}`);
}); 