import express from 'express';
import {
  createChild,
  getMyChildren,
  getChildById,
  updateChild,
  deleteChild,
} from '../controllers/childController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, requireRole('parent'));

router.route('/').post(createChild).get(getMyChildren);

router.route('/:id').get(getChildById).put(updateChild).delete(deleteChild);

export default router;
