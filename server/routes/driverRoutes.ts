import { Router } from 'express';
import { 
  getAllDrivers, 
  getDriverById, 
  createDriver, 
  updateDriver, 
  deleteDriver 
} from '../controllers/driverController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all driver routes
router.use(protect);

router.get('/', getAllDrivers);
router.get('/:id', getDriverById);
router.post('/', authorize('admin', 'dispatcher'), createDriver);
router.put('/:id', authorize('admin', 'dispatcher'), updateDriver);
router.delete('/:id', authorize('admin'), deleteDriver);

export default router;
