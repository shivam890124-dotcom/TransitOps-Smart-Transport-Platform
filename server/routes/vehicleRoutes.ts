import { Router } from 'express';
import { 
  getAllVehicles, 
  getVehicleById, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle 
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// All vehicle routes are protected
router.use(protect);

router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.post('/', authorize('admin', 'dispatcher'), createVehicle);
router.put('/:id', authorize('admin', 'dispatcher'), updateVehicle);
router.delete('/:id', authorize('admin'), deleteVehicle);

export default router;
