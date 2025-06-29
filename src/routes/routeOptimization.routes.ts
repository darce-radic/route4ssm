import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { body, param } from 'express-validator';
import { 
  createOptimizationJob,
  getOptimizationStatus,
  getOptimizationResult
} from '../controllers/routeOptimization.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const validateOptimizationRequest = [
  body('depot').isObject().withMessage('Depot must be an object'),
  body('depot.name').notEmpty().withMessage('Depot name is required'),
  body('depot.address').notEmpty().withMessage('Depot address is required'),
  body('depot.coordinates').isObject().withMessage('Depot coordinates must be an object'),
  body('depot.coordinates.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('depot.coordinates.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('jobs').isArray({ min: 1 }).withMessage('At least one job is required'),
  body('jobs.*.id').notEmpty().withMessage('Job ID is required'),
  body('jobs.*.address').notEmpty().withMessage('Job address is required'),
  body('jobs.*.coordinates').isObject().withMessage('Job coordinates must be an object'),
  body('jobs.*.coordinates.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid job latitude'),
  body('jobs.*.coordinates.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid job longitude'),
  body('jobs.*.time_window').isObject().withMessage('Job time window must be an object'),
  body('jobs.*.time_window.start').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:mm)'),
  body('jobs.*.time_window.end').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:mm)'),
  body('jobs.*.service_time').isInt({ min: 1 }).withMessage('Service time must be a positive integer'),
  body('jobs.*.priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
  body('technicians').isArray({ min: 1 }).withMessage('At least one technician is required'),
  body('technicians.*.id').notEmpty().withMessage('Technician ID is required'),
  body('technicians.*.name').notEmpty().withMessage('Technician name is required'),
  body('technicians.*.home_address').notEmpty().withMessage('Technician home address is required'),
  body('technicians.*.home_coordinates').isObject().withMessage('Technician coordinates must be an object'),
  body('technicians.*.home_coordinates.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid technician latitude'),
  body('technicians.*.home_coordinates.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid technician longitude'),
  body('technicians.*.working_hours').isObject().withMessage('Working hours must be an object'),
  body('technicians.*.working_hours.start').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid working hours start time'),
  body('technicians.*.working_hours.end').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid working hours end time'),
  body('technicians.*.skills').isArray().withMessage('Skills must be an array'),
];

const validateJobId = [
  param('jobId').isUUID().withMessage('Invalid job ID format'),
];

router.post('/', validateOptimizationRequest, validateRequest, createOptimizationJob);
router.get('/status/:jobId', validateJobId, validateRequest, getOptimizationStatus);
router.get('/result/:jobId', validateJobId, validateRequest, getOptimizationResult);

export default router; 