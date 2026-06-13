import express from 'express';
import { getCustomers, getCustomerById } from '../controllers/customerController.js';
import { getCustomerOrders } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getCustomers);
router.route('/:id').get(protect, getCustomerById);
router.route('/:id/orders').get(protect, getCustomerOrders);

export default router;
