import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Validation middleware
const userValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['admin', 'manager', 'technician'])
];

// Routes
router.post('/users', authenticate, userValidation, validateRequest, authController.createOrUpdateUser);
router.get('/users/:id', authenticate, authController.getUser);

export default router; 