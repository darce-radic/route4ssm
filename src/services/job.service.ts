import { Repository } from 'typeorm';
import { Job } from '../entities/Job';
import { logger } from '../utils/logger';

export class JobService {
  constructor(private jobRepository: Repository<Job>) {}

  async createJob(data: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Job> {
    const job = this.jobRepository.create({
      ...data,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.jobRepository.save(job);
    logger.info('Created new job', { jobId: job.id });
    return job;
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });
    if (!job) {
      throw new Error('Job not found');
    }

    Object.assign(job, {
      ...data,
      updated_at: new Date(),
    });

    await this.jobRepository.save(job);
    logger.info('Updated job', { jobId: id });
    return job;
  }

  async getJob(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['technician'],
    });
    if (!job) {
      throw new Error('Job not found');
    }
    return job;
  }

  async listJobs(options: {
    status?: Job['status'];
    technician_id?: string;
    job_type?: string;
    date_range?: { start: Date; end: Date };
    page?: number;
    limit?: number;
  } = {}): Promise<{ jobs: Job[]; total: number }> {
    const { status, technician_id, job_type, date_range, page = 1, limit = 10 } = options;
    
    const queryBuilder = this.jobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.technician', 'technician');

    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }

    if (technician_id) {
      queryBuilder.andWhere('job.technician_id = :technician_id', { technician_id });
    }

    if (job_type) {
      queryBuilder.andWhere('job.job_type = :job_type', { job_type });
    }

    if (date_range) {
      queryBuilder.andWhere('job.created_at BETWEEN :start AND :end', {
        start: date_range.start,
        end: date_range.end,
      });
    }

    const [jobs, total] = await queryBuilder
      .orderBy('job.priority', 'DESC')
      .addOrderBy('job.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { jobs, total };
  }

  async assignJob(jobId: string, technicianId: string): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error('Job not found');
    }

    job.technician_id = technicianId;
    job.status = 'assigned';
    job.updated_at = new Date();

    await this.jobRepository.save(job);
    logger.info('Assigned job to technician', { jobId, technicianId });
    return job;
  }

  async updateJobStatus(jobId: string, status: Job['status']): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error('Job not found');
    }

    job.status = status;
    job.updated_at = new Date();

    if (status === 'completed') {
      job.completed_at = new Date();
    }

    await this.jobRepository.save(job);
    logger.info('Updated job status', { jobId, status });
    return job;
  }

  async cancelJob(jobId: string, notes?: string): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error('Job not found');
    }

    job.status = 'cancelled';
    job.notes = notes;
    job.updated_at = new Date();

    await this.jobRepository.save(job);
    logger.info('Cancelled job', { jobId });
    return job;
  }
} 