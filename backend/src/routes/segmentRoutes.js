import express from 'express';
import { buildSegment, saveSegment, getSegments } from '../controllers/segmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/build').post(protect, buildSegment);
router.route('/').post(protect, saveSegment).get(protect, getSegments);

export default router;
