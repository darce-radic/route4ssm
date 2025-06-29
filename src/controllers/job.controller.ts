import { Request, Response } from 'express';
import { JobService } from '../services/job.service';
import { AppDataSource } from '../config/database';
import { Job } from '../entities/Job';
import { logger } from '../utils/logger';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService(AppDataSource.getRepository(Job));
  }

  createJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await this.jobService.createJob(req.body);
      res.status(201).json(job);
    } catch (error) {
      logger.error('Error creating job', { error });
      res.status(500).json({ error: 'Failed to create job' });
    }
  };

  updateJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await this.jobService.updateJob(req.params.id, req.body);
      res.json(job);
    } catch (error) {
      logger.error('Error updating job', { error, jobId: req.params.id });
      res.status(404).json({ error: 'Job not found' });
    }
  };

  getJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await this.jobService.getJob(req.params.id);
      res.json(job);
    } catch (error) {
      logger.error('Error getting job', { error, jobId: req.params.id });
      res.status(404).json({ error: 'Job not found' });
    }
  };

  listJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, technician_id, job_type, start_date, end_date, page, limit } = req.query;
      
      const result = await this.jobService.listJobs({
        status: status as Job['status'],
        technician_id: technician_id as string,
        job_type: job_type as string,
        date_range: start_date && end_date ? {
          start: new Date(start_date as string),
          end: new Date(end_date as string),
        } : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json(result);
    } catch (error) {
      logger.error('Error listing jobs', { error });
      res.status(500).json({ error: 'Failed to list jobs' });
    }
  };

  assignJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { technician_id } = req.body;
      if (!technician_id) {
        res.status(400).json({ error: 'Technician ID is required' });
        return;
      }

      const job = await this.jobService.assignJob(req.params.id, technician_id);
      res.json(job);
    } catch (error) {
      logger.error('Error assigning job', { error, jobId: req.params.id });
      res.status(404).json({ error: 'Job not found' });
    }
  };

  updateJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      const job = await this.jobService.updateJobStatus(req.params.id, status);
      res.json(job);
    } catch (error) {
      logger.error('Error updating job status', { error, jobId: req.params.id });
      res.status(404).json({ error: 'Job not found' });
    }
  };

  cancelJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notes } = req.body;
      const job = await this.jobService.cancelJob(req.params.id, notes);
      res.json(job);
    } catch (error) {
      logger.error('Error cancelling job', { error, jobId: req.params.id });
      res.status(404).json({ error: 'Job not found' });
    }
  };
} 