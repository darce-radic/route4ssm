import { Repository } from 'typeorm';
import { Technician } from '../entities/Technician';
import { logger } from '../utils/logger';

export class TechnicianService {
  constructor(private technicianRepository: Repository<Technician>) {}

  async createTechnician(data: Omit<Technician, 'id' | 'created_at' | 'updated_at'>): Promise<Technician> {
    const technician = this.technicianRepository.create({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await this.technicianRepository.save(technician);
    logger.info('Created new technician', { technicianId: technician.id });
    return technician;
  }

  async updateTechnician(id: string, data: Partial<Technician>): Promise<Technician> {
    const technician = await this.technicianRepository.findOne({ where: { id } });
    if (!technician) {
      throw new Error('Technician not found');
    }

    Object.assign(technician, {
      ...data,
      updated_at: new Date(),
    });

    await this.technicianRepository.save(technician);
    logger.info('Updated technician', { technicianId: id });
    return technician;
  }

  async getTechnician(id: string): Promise<Technician> {
    const technician = await this.technicianRepository.findOne({ where: { id } });
    if (!technician) {
      throw new Error('Technician not found');
    }
    return technician;
  }

  async listTechnicians(options: {
    isActive?: boolean;
    skills?: string[];
    page?: number;
    limit?: number;
  } = {}): Promise<{ technicians: Technician[]; total: number }> {
    const { isActive, skills, page = 1, limit = 10 } = options;
    
    const queryBuilder = this.technicianRepository.createQueryBuilder('technician');

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('technician.is_active = :isActive', { isActive });
    }

    if (skills?.length) {
      queryBuilder.andWhere('technician.skills @> :skills', { skills });
    }

    const [technicians, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { technicians, total };
  }

  async deactivateTechnician(id: string): Promise<void> {
    const technician = await this.technicianRepository.findOne({ where: { id } });
    if (!technician) {
      throw new Error('Technician not found');
    }

    technician.is_active = false;
    technician.updated_at = new Date();
    await this.technicianRepository.save(technician);
    logger.info('Deactivated technician', { technicianId: id });
  }

  async activateTechnician(id: string): Promise<void> {
    const technician = await this.technicianRepository.findOne({ where: { id } });
    if (!technician) {
      throw new Error('Technician not found');
    }

    technician.is_active = true;
    technician.updated_at = new Date();
    await this.technicianRepository.save(technician);
    logger.info('Activated technician', { technicianId: id });
  }
} 