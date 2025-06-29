import { Request, Response } from 'express';
import { routeOptimizationQueue } from '../services/queue/routeOptimization.queue';
import { logger } from '../utils/logger';
import { AppError } from '../utils/error';
import { OptimizationRequest } from '../types/optimization.types';

export const createOptimizationJob = async (req: Request, res: Response) => {
  console.log('\n🎯 === CREATE OPTIMIZATION JOB ===');
  console.log(`📅 Request received at: ${new Date().toISOString()}`);
  console.log(`👤 User IP: ${req.ip}`);
  console.log(`📋 Request ID: ${req.headers['x-request-id'] || 'N/A'}`);
  
  try {
    const optimizationRequest: OptimizationRequest = req.body;
    
    console.log('📊 Optimization Request Data:');
    console.log(`   Jobs: ${optimizationRequest.jobs?.length || 0}`);
    console.log(`   Technicians: ${optimizationRequest.technicians?.length || 0}`);
    console.log(`   Depot: ${optimizationRequest.depot?.name || 'N/A'}`);
    
    // Validate that we have the required data
    if (!optimizationRequest.jobs || optimizationRequest.jobs.length === 0) {
      console.log('❌ Validation failed: No jobs provided');
      throw new AppError(400, 'At least one job is required for optimization');
    }
    
    if (!optimizationRequest.technicians || optimizationRequest.technicians.length === 0) {
      console.log('❌ Validation failed: No technicians provided');
      throw new AppError(400, 'At least one technician is required for optimization');
    }

    console.log('✅ Validation passed, creating optimization job...');
    
    const job = await routeOptimizationQueue.add('optimize', optimizationRequest, {
      priority: 1,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    
    console.log(`✅ Optimization job created successfully:`);
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Job Count: ${optimizationRequest.jobs.length}`);
    console.log(`   Queue: ${routeOptimizationQueue.name}`);
    
    logger.info('Created optimization job', { jobId: job.id, jobCount: optimizationRequest.jobs.length });
    
    const response = {
      jobId: job.id,
      status: 'queued',
      message: 'Optimization job created successfully'
    };
    
    console.log('📤 Sending response:', response);
    res.status(201).json(response);
    
  } catch (error) {
    console.error('❌ Error in createOptimizationJob:', error);
    logger.error('Error creating optimization job:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create optimization job' });
    }
  }
};

export const getOptimizationStatus = async (req: Request, res: Response) => {
  console.log('\n📊 === GET OPTIMIZATION STATUS ===');
  console.log(`📅 Request received at: ${new Date().toISOString()}`);
  console.log(`👤 User IP: ${req.ip}`);
  
  try {
    const { jobId } = req.params;
    console.log(`🔍 Looking up job: ${jobId}`);
    
    const job = await routeOptimizationQueue.getJob(jobId);
    
    if (!job) {
      console.log(`❌ Job not found: ${jobId}`);
      throw new AppError(404, 'Optimization job not found');
    }
    
    const state = await job.getState();
    const progress = await job.progress();
    
    console.log(`✅ Job found: ${jobId}`);
    console.log(`   State: ${state}`);
    console.log(`   Progress: ${progress || 0}%`);
    console.log(`   Timestamp: ${job.timestamp}`);
    console.log(`   Failed Reason: ${job.failedReason || 'N/A'}`);
    
    const response = {
      jobId,
      status: state,
      progress: progress || 0,
      timestamp: job.timestamp,
      failedReason: job.failedReason
    };
    
    console.log('📤 Sending response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in getOptimizationStatus:', error);
    logger.error('Error getting optimization status:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get optimization status' });
    }
  }
};

export const getOptimizationResult = async (req: Request, res: Response) => {
  console.log('\n📈 === GET OPTIMIZATION RESULT ===');
  console.log(`📅 Request received at: ${new Date().toISOString()}`);
  console.log(`👤 User IP: ${req.ip}`);
  
  try {
    const { jobId } = req.params;
    console.log(`🔍 Looking up job: ${jobId}`);
    
    const job = await routeOptimizationQueue.getJob(jobId);
    
    if (!job) {
      console.log(`❌ Job not found: ${jobId}`);
      throw new AppError(404, 'Optimization job not found');
    }
    
    const state = await job.getState();
    console.log(`✅ Job found: ${jobId}, State: ${state}`);
    
    if (state === 'completed' && job.returnvalue) {
      console.log(`🎉 Job completed successfully`);
      console.log(`📊 Result summary:`, {
        totalJobs: job.returnvalue.summary?.total_jobs,
        totalRoutes: job.returnvalue.summary?.total_routes,
        optimizationScore: job.returnvalue.summary?.optimization_score
      });
      
      const response = {
        jobId,
        status: 'completed',
        result: job.returnvalue,
        completedAt: job.finishedOn
      };
      
      console.log('📤 Sending completed result');
      res.json(response);
      
    } else if (state === 'failed') {
      console.log(`❌ Job failed: ${job.failedReason || 'Unknown error'}`);
      throw new AppError(400, `Optimization failed: ${job.failedReason || 'Unknown error'}`);
    } else {
      console.log(`⏳ Job still processing: ${state}`);
      const response = { 
        jobId,
        status: 'processing',
        message: 'Optimization is still in progress'
      };
      
      console.log('📤 Sending processing status');
      res.status(202).json(response);
    }
    
  } catch (error) {
    console.error('❌ Error in getOptimizationResult:', error);
    logger.error('Error getting optimization result:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get optimization result' });
    }
  }
}; 