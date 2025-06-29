import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  createOptimizationJob,
  getOptimizationStatus,
  getOptimizationResult
} from '../controllers/routeOptimization.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createOptimizationJob);
router.get('/status/:jobId', getOptimizationStatus);
router.get('/result/:jobId', getOptimizationResult);

export default router; 