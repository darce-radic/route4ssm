import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Job } from '../entities/Job';
import { Technician } from '../entities/Technician';
import { OptimizationJob } from '../entities/OptimizationJob';
import { logger } from '../utils/logger';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'route4ssm',
  password: process.env.DB_PASSWORD || 'route4ssm_password',
  database: process.env.DB_NAME || 'route4ssm',
  synchronize: true, // Be careful with this in production
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Job, Technician, OptimizationJob],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection initialized');
  } catch (error) {
    logger.error('Error initializing database connection:', error);
    throw error;
  }
}; 