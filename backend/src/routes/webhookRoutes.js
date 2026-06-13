import express from 'express';
import { handleDeliveryWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.route('/delivery').post(handleDeliveryWebhook);

export default router;
