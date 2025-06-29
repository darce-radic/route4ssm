import { Request, Response } from 'express';
import { TechnicianService } from '../services/technician.service';
import { AppDataSource } from '../config/database';
import { Technician } from '../entities/Technician';
import { logger } from '../utils/logger';

export class TechnicianController {
  private technicianService: TechnicianService;

  constructor() {
    this.technicianService = new TechnicianService(AppDataSource.getRepository(Technician));
  }

  createTechnician = async (req: Request, res: Response): Promise<void> => {
    try {
      const technician = await this.technicianService.createTechnician(req.body);
      res.status(201).json(technician);
    } catch (error) {
      logger.error('Error creating technician', { error });
      res.status(500).json({ error: 'Failed to create technician' });
    }
  };

  updateTechnician = async (req: Request, res: Response): Promise<void> => {
    try {
      const technician = await this.technicianService.updateTechnician(req.params.id, req.body);
      res.json(technician);
    } catch (error) {
      logger.error('Error updating technician', { error, technicianId: req.params.id });
      res.status(404).json({ error: 'Technician not found' });
    }
  };

  getTechnician = async (req: Request, res: Response): Promise<void> => {
    try {
      const technician = await this.technicianService.getTechnician(req.params.id);
      res.json(technician);
    } catch (error) {
      logger.error('Error getting technician', { error, technicianId: req.params.id });
      res.status(404).json({ error: 'Technician not found' });
    }
  };

  listTechnicians = async (req: Request, res: Response): Promise<void> => {
    try {
      const { isActive, skills, page, limit } = req.query;
      const result = await this.technicianService.listTechnicians({
        isActive: isActive === 'true',
        skills: typeof skills === 'string' ? skills.split(',') : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      logger.error('Error listing technicians', { error });
      res.status(500).json({ error: 'Failed to list technicians' });
    }
  };

  deactivateTechnician = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.technicianService.deactivateTechnician(req.params.id);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deactivating technician', { error, technicianId: req.params.id });
      res.status(404).json({ error: 'Technician not found' });
    }
  };

  activateTechnician = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.technicianService.activateTechnician(req.params.id);
      res.status(204).send();
    } catch (error) {
      logger.error('Error activating technician', { error, technicianId: req.params.id });
      res.status(404).json({ error: 'Technician not found' });
    }
  };
} 