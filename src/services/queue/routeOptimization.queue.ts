/* Load environment variables */
import 'dotenv/config';

import { Queue, Worker } from 'bullmq';
import { OptimizationAlgorithmService } from '../optimization/optimizationAlgorithm.service';
import { logger } from '../../utils/logger';
import { OptimizationRequest } from '../../types/optimization.types';
import { v4 as uuidv4 } from 'uuid';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const optimizationService = new OptimizationAlgorithmService();

export const routeOptimizationQueue = new Queue('route-optimization', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Create a worker to process jobs
const worker = new Worker('route-optimization', async (job) => {
  logger.info(`Processing job ${job.id}`);
  try {
    const optimizationRequest = job.data as OptimizationRequest;
    const result = await optimizationService.optimize(optimizationRequest);
    return result;
  } catch (error) {
    logger.error(`Error processing job ${job.id}:`, error);
    throw error;
  }
}, { connection });

// Handle worker events
worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, error) => {
  logger.error(`Job ${job?.id} failed:`, error);
});

export const addOptimizationJob = async (data: OptimizationRequest) => {
  return routeOptimizationQueue.add('optimize', data, {
    priority: 1,
    jobId: uuidv4(),
  });
};

export const getJobStatus = async (jobId: string) => {
  const job = await routeOptimizationQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = await job.progress();
  const result = job.returnvalue;

  return {
    id: job.id,
    state,
    progress,
    result,
    failedReason: job.failedReason,
    timestamp: job.timestamp,
  };
};

export default routeOptimizationQueue; 