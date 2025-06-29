import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { validateRequest } from '../middleware/validateRequest';
import { body } from 'express-validator';

const router = Router();
const jobController = new JobController();

// Validation middleware
const validateJob = [
  body('address').notEmpty().withMessage('Address is required'),
  body('coordinates').isObject().withMessage('Coordinates must be an object')
    .custom((value) => {
      if (!value.latitude || !value.longitude) {
        throw new Error('Coordinates must include latitude and longitude');
      }
      return true;
    }),
  body('time_window').isObject().withMessage('Time window must be an object')
    .custom((value) => {
      if (!value.start || !value.end) {
        throw new Error('Time window must include start and end times');
      }
      return true;
    }),
  body('service_time').isInt({ min: 1 }).withMessage('Service time must be a positive integer'),
  body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
  body('job_type').notEmpty().withMessage('Job type is required'),
];

const validateJobAssignment = [
  body('technician_id').notEmpty().withMessage('Technician ID is required'),
];

const validateJobStatus = [
  body('status').isIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];

// Routes
router.post('/', validateJob, validateRequest, jobController.createJob);
router.put('/:id', validateJob, validateRequest, jobController.updateJob);
router.get('/:id', jobController.getJob);
router.get('/', jobController.listJobs);
router.post('/:id/assign', validateJobAssignment, validateRequest, jobController.assignJob);
router.post('/:id/status', validateJobStatus, validateRequest, jobController.updateJobStatus);
router.post('/:id/cancel', jobController.cancelJob);

export default router; 