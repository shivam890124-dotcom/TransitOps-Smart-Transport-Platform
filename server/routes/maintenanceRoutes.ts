import { Router } from 'express';
import { 
  getAllMaintenance, 
  createMaintenance, 
  updateMaintenance, 
  deleteMaintenance 
} from '../controllers/maintenanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getAllMaintenance);
router.post('/', authorize('admin', 'dispatcher'), createMaintenance);
router.put('/:id', authorize('admin', 'dispatcher'), updateMaintenance);
router.delete('/:id', authorize('admin'), deleteMaintenance);

export default router;
