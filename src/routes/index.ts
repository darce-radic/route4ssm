import { Express } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import technicianRoutes from './technician.routes';
import routeOptimizationRoutes from './routeOptimization.routes';

export const setupRoutes = (app: Express) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/technicians', technicianRoutes);
  app.use('/api/route-optimization', routeOptimizationRoutes);
}; 