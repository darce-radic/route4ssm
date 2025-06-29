import { Repository } from 'typeorm';
import { OptimizationJob } from '../entities/OptimizationJob';
import { OptimizationAlgorithmService } from './optimization/optimizationAlgorithm.service';
import { RoutingProvider } from '../providers/routing.provider';
import { logger } from '../utils/logger';
import { OptimizationRequest, OptimizationResult, RouteStop } from '../types/optimization.types';

interface RouteStopWithGeometry extends RouteStop {
  geometry?: any; // Replace 'any' with proper type from routing provider
}

export class RouteOptimizationService {
  constructor(
    private optimizationJobRepository: Repository<OptimizationJob>,
    private routingProvider: RoutingProvider,
    private optimizationAlgorithm: OptimizationAlgorithmService
  ) {}

  async createOptimizationJob(request: OptimizationRequest): Promise<string> {
    const job = new OptimizationJob();
    job.status = 'pending';
    job.request = request;
    job.created_at = new Date();
    
    const savedJob = await this.optimizationJobRepository.save(job);
    
    // Start optimization process asynchronously
    this.processOptimizationJob(savedJob.id).catch(error => {
      logger.error('Error processing optimization job', { jobId: savedJob.id, error });
    });

    return savedJob.id;
  }

  async getOptimizationStatus(jobId: string): Promise<{ status: string; progress: number }> {
    const job = await this.optimizationJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error('Optimization job not found');
    }
    return {
      status: job.status,
      progress: job.progress || 0
    };
  }

  async getOptimizationResult(jobId: string): Promise<OptimizationResult> {
    const job = await this.optimizationJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error('Optimization job not found');
    }
    if (job.status !== 'completed') {
      throw new Error('Optimization job not completed');
    }
    return job.result as OptimizationResult;
  }

  private async processOptimizationJob(jobId: string): Promise<void> {
    const job = await this.optimizationJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error('Optimization job not found');
    }

    try {
      // Update job status to processing
      job.status = 'processing';
      job.progress = 0;
      await this.optimizationJobRepository.save(job);

      // Run optimization algorithm
      const result = await this.optimizationAlgorithm.optimize(job.request as OptimizationRequest);

      // For each route, get the detailed path from the routing provider
      for (const route of result.routes) {
        const stops = route.stops as RouteStopWithGeometry[];
        for (let i = 0; i < stops.length - 1; i++) {
          const from = stops[i].location.coordinates;
          const to = stops[i + 1].location.coordinates;
          
          try {
            const pathResult = await this.routingProvider.getRoute(
              { latitude: from.latitude, longitude: from.longitude },
              { latitude: to.latitude, longitude: to.longitude }
            );
            
            // Update the geometry for this segment
            stops[i].geometry = pathResult.geometry;
          } catch (error) {
            logger.error('Error getting route geometry', {
              jobId,
              fromLocation: from,
              toLocation: to,
              error
            });
          }
        }

        // Update progress
        job.progress = ((route.stops.length / result.routes.length) * 100);
        await this.optimizationJobRepository.save(job);
      }

      // Update job with results
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      job.completed_at = new Date();
      await this.optimizationJobRepository.save(job);

      logger.info('Optimization job completed successfully', {
        jobId,
        totalRoutes: result.routes.length,
        totalJobs: result.summary.total_jobs
      });
    } catch (error) {
      // Update job status to failed
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await this.optimizationJobRepository.save(job);

      logger.error('Optimization job failed', {
        jobId,
        error
      });

      throw error;
    }
  }
} 