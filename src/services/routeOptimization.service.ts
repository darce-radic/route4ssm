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
  ) {
    console.log('🔧 RouteOptimizationService initialized');
  }

  async createOptimizationJob(request: OptimizationRequest): Promise<string> {
    console.log('\n📝 === CREATE OPTIMIZATION JOB ===');
    console.log(`📅 Creating job at: ${new Date().toISOString()}`);
    console.log(`📊 Request details: ${request.jobs?.length || 0} jobs, ${request.technicians?.length || 0} technicians`);
    
    const job = new OptimizationJob();
    job.status = 'pending';
    job.request = request;
    job.created_at = new Date();
    
    console.log('💾 Saving job to database...');
    const savedJob = await this.optimizationJobRepository.save(job);
    console.log(`✅ Job saved with ID: ${savedJob.id}`);
    
    // Start optimization process asynchronously
    console.log('🚀 Starting async optimization process...');
    this.processOptimizationJob(savedJob.id).catch(error => {
      console.error('❌ Error in async optimization process:', error);
      logger.error('Error processing optimization job', { jobId: savedJob.id, error });
    });

    return savedJob.id;
  }

  async getOptimizationStatus(jobId: string): Promise<{ status: string; progress: number }> {
    console.log(`\n📊 === GET OPTIMIZATION STATUS ===`);
    console.log(`🔍 Looking up job: ${jobId}`);
    
    const job = await this.optimizationJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      console.log(`❌ Job not found: ${jobId}`);
      throw new Error('Optimization job not found');
    }
    
    console.log(`✅ Job found: ${jobId}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Progress: ${job.progress || 0}%`);
    console.log(`   Created: ${job.created_at}`);
    console.log(`   Completed: ${job.completed_at || 'N/A'}`);
    
    return {
      status: job.status,
      progress: job.progress || 0
    };
  }

  async getOptimizationResult(jobId: string): Promise<OptimizationResult> {
    console.log(`\n📈 === GET OPTIMIZATION RESULT ===`);
    console.log(`🔍 Looking up job: ${jobId}`);
    
    const job = await this.optimizationJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      console.log(`❌ Job not found: ${jobId}`);
      throw new Error('Optimization job not found');
    }
    
    console.log(`✅ Job found: ${jobId}, Status: ${job.status}`);
    
    if (job.status !== 'completed') {
      console.log(`❌ Job not completed: ${job.status}`);
      throw new Error('Optimization job not completed');
    }
    
    console.log(`🎉 Returning completed result for job: ${jobId}`);
    return job.result as OptimizationResult;
  }

  private async processOptimizationJob(jobId: string): Promise<void> {
    console.log(`\n⚙️  === PROCESS OPTIMIZATION JOB ===`);
    console.log(`🔍 Processing job: ${jobId}`);
    
    const job = await this.optimizationJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      console.log(`❌ Job not found: ${jobId}`);
      throw new Error('Optimization job not found');
    }

    try {
      console.log('📝 Updating job status to processing...');
      // Update job status to processing
      job.status = 'processing';
      job.progress = 0;
      await this.optimizationJobRepository.save(job);
      console.log('✅ Job status updated to processing');

      console.log('🧮 Running optimization algorithm...');
      // Run optimization algorithm
      const result = await this.optimizationAlgorithm.optimize(job.request as OptimizationRequest);
      console.log(`✅ Optimization algorithm completed:`);
      console.log(`   Total routes: ${result.routes.length}`);
      console.log(`   Total jobs: ${result.summary.total_jobs}`);
      console.log(`   Optimization score: ${(result.summary.optimization_score * 100).toFixed(1)}%`);

      console.log('🗺️  Getting detailed route geometry...');
      // For each route, get the detailed path from the routing provider
      for (let routeIndex = 0; routeIndex < result.routes.length; routeIndex++) {
        const route = result.routes[routeIndex];
        console.log(`   Processing route ${routeIndex + 1}/${result.routes.length} for technician ${route.technician_id}`);
        
        const stops = route.stops as RouteStopWithGeometry[];
        for (let i = 0; i < stops.length - 1; i++) {
          const from = stops[i].location.coordinates;
          const to = stops[i + 1].location.coordinates;
          
          console.log(`     Getting route from stop ${i} to ${i + 1}...`);
          
          try {
            const pathResult = await this.routingProvider.getRoute(
              { latitude: from.latitude, longitude: from.longitude },
              { latitude: to.latitude, longitude: to.longitude }
            );
            
            // Update the geometry for this segment
            stops[i].geometry = pathResult.geometry;
            console.log(`     ✅ Route geometry obtained for segment ${i}->${i + 1}`);
          } catch (error) {
            console.error(`     ❌ Error getting route geometry for segment ${i}->${i + 1}:`, error);
            logger.error('Error getting route geometry', {
              jobId,
              fromLocation: from,
              toLocation: to,
              error
            });
          }
        }

        // Update progress
        const progress = ((routeIndex + 1) / result.routes.length) * 100;
        job.progress = progress;
        await this.optimizationJobRepository.save(job);
        console.log(`   ✅ Route ${routeIndex + 1} processed, progress: ${progress.toFixed(1)}%`);
      }

      console.log('💾 Saving final results...');
      // Update job with results
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      job.completed_at = new Date();
      await this.optimizationJobRepository.save(job);

      console.log('🎉 Optimization job completed successfully!');
      console.log(`📊 Final results:`);
      console.log(`   Job ID: ${jobId}`);
      console.log(`   Total routes: ${result.routes.length}`);
      console.log(`   Total jobs: ${result.summary.total_jobs}`);
      console.log(`   Total distance: ${result.summary.total_distance.toFixed(2)}km`);
      console.log(`   Total time: ${result.summary.total_time}min`);
      console.log(`   Optimization score: ${(result.summary.optimization_score * 100).toFixed(1)}%`);

      logger.info('Optimization job completed successfully', {
        jobId,
        totalRoutes: result.routes.length,
        totalJobs: result.summary.total_jobs
      });
    } catch (error) {
      console.error('❌ Optimization job failed:', error);
      
      // Update job status to failed
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await this.optimizationJobRepository.save(job);

      console.log('💾 Job status updated to failed');

      logger.error('Optimization job failed', {
        jobId,
        error
      });

      throw error;
    }
  }
} 