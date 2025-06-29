import { Router } from 'express';
import { TechnicianController } from '../controllers/technician.controller';
import { validateRequest } from '../middleware/validateRequest';
import { body } from 'express-validator';

const router = Router();
const technicianController = new TechnicianController();

// Validation middleware
const validateTechnician = [
  body('name').notEmpty().withMessage('Name is required'),
  body('home_address').notEmpty().withMessage('Home address is required'),
  body('home_coordinates').isObject().withMessage('Home coordinates must be an object')
    .custom((value) => {
      if (!value.latitude || !value.longitude) {
        throw new Error('Home coordinates must include latitude and longitude');
      }
      return true;
    }),
  body('working_hours').isObject().withMessage('Working hours must be an object')
    .custom((value) => {
      if (!value.start || !value.end) {
        throw new Error('Working hours must include start and end times');
      }
      return true;
    }),
  body('skills').isArray().withMessage('Skills must be an array'),
];

// Routes
router.post('/', validateTechnician, validateRequest, technicianController.createTechnician);
router.put('/:id', validateTechnician, validateRequest, technicianController.updateTechnician);
router.get('/:id', technicianController.getTechnician);
router.get('/', technicianController.listTechnicians);
router.post('/:id/deactivate', technicianController.deactivateTechnician);
router.post('/:id/activate', technicianController.activateTechnician);

export default router; 