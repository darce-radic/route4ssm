import { Express } from 'express';

export const setupRoutes = (app: Express) => {
  // Try to load routes, but don't fail if database dependencies are missing
  try {
    const authRoutes = require('./auth.routes').default;
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
  } catch (error) {
    console.log('⚠️  Auth routes not available (database dependency)');
  }

  try {
    const jobRoutes = require('./job.routes').default;
    app.use('/api/jobs', jobRoutes);
    console.log('✅ Job routes loaded');
  } catch (error) {
    console.log('⚠️  Job routes not available (database dependency)');
  }

  try {
    const technicianRoutes = require('./technician.routes').default;
    app.use('/api/technicians', technicianRoutes);
    console.log('✅ Technician routes loaded');
  } catch (error) {
    console.log('⚠️  Technician routes not available (database dependency)');
  }

  try {
    const routeOptimizationRoutes = require('./routeOptimization.routes').default;
    app.use('/api/route-optimization', routeOptimizationRoutes);
    console.log('✅ Route optimization routes loaded');
  } catch (error) {
    console.log('⚠️  Route optimization routes not available (database dependency)');
  }
}; 