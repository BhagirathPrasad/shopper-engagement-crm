import express from 'express';
import { createCampaign, getCampaigns, launchCampaign, launchDirectCampaign, getCampaignCommunications } from '../controllers/campaignController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(protect, createCampaign).get(protect, getCampaigns);
router.route('/launch').post(protect, launchDirectCampaign);
router.route('/:id/launch').post(protect, launchCampaign);
router.route('/:id/communications').get(protect, getCampaignCommunications);

export default router;
