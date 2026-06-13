import express from 'express';
import { getOrders, getOrderById } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getOrders);
router.route('/:id').get(protect, getOrderById);

export default router;
