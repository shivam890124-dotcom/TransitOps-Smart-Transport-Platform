import { Router } from 'express';
import { 
  getAllTrips, 
  getTripById, 
  createTrip, 
  updateTripStatus, 
  deleteTrip 
} from '../controllers/tripController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getAllTrips);
router.get('/:id', getTripById);
router.post('/', authorize('admin', 'dispatcher'), createTrip);
router.put('/:id/status', authorize('admin', 'dispatcher'), updateTripStatus);
router.delete('/:id', authorize('admin'), deleteTrip);

export default router;
