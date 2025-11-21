import { Router } from 'express';
import { getDraftHomepage, getPublishedHomepage, upsertHomepage } from '../controllers/homepageController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getPublishedHomepage);
router.get('/draft', protect, authorize('admin'), getDraftHomepage);
router.put('/', protect, authorize('admin'), upsertHomepage);

export default router;

