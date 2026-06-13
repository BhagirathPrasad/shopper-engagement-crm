import express from 'express';
import { getDashboardAnalytics, seedData, getChartsData } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/dashboard').get(protect, getDashboardAnalytics);
router.route('/seed').post(protect, seedData);
router.route('/charts').get(protect, getChartsData);

export default router;
