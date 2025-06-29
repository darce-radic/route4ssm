import { Request, Response } from 'express';
import { routeOptimizationQueue } from '../services/queue/routeOptimization.queue';
import { logger } from '../utils/logger';

export const createOptimizationJob = async (req: Request, res: Response) => {
  try {
    const jobData = req.body;
    const job = await routeOptimizationQueue.add('optimize', jobData);
    
    res.status(201).json({
      jobId: job.id,
      status: 'queued'
    });
  } catch (error) {
    logger.error('Error creating optimization job:', error);
    res.status(500).json({ error: 'Failed to create optimization job' });
  }
};

export const getOptimizationStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await routeOptimizationQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const state = await job.getState();
    res.json({ jobId, status: state });
  } catch (error) {
    logger.error('Error getting optimization status:', error);
    res.status(500).json({ error: 'Failed to get optimization status' });
  }
};

export const getOptimizationResult = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await routeOptimizationQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.returnvalue) {
      res.json(job.returnvalue);
    } else if (job.failedReason) {
      res.status(400).json({ error: job.failedReason });
    } else {
      res.status(202).json({ status: 'processing' });
    }
  } catch (error) {
    logger.error('Error getting optimization result:', error);
    res.status(500).json({ error: 'Failed to get optimization result' });
  }
}; 