import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Communication from '../models/Communication.js';
import { enqueueCampaign } from '../queues/campaignQueue.js';

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private
export const createCampaign = async (req, res, next) => {
  try {
    const { name, segmentId, channel, contentTemplate } = req.body;

    const campaign = await Campaign.create({
      name,
      segmentId,
      channel,
      contentTemplate,
      createdBy: req.user._id,
    });

    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
export const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find().populate('segmentId', 'name audienceSize').sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    next(error);
  }
};

// @desc    Launch campaign (Add to Queue)
// @route   POST /api/campaigns/:id/launch
// @access  Private
export const launchCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404);
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'Draft') {
      res.status(400);
      throw new Error('Only Draft campaigns can be launched');
    }

    // Enqueue via BullMQ (falls back to synchronous if Redis unavailable)
    await enqueueCampaign(campaign._id);
    
    campaign.status = 'Scheduled';
    await campaign.save();

    res.json({ message: 'Campaign scheduled for execution', campaign });
  } catch (error) {
    next(error);
  }
};

// @desc    Launch direct campaign from Copilot
// @route   POST /api/campaigns/launch
// @access  Private
export const launchDirectCampaign = async (req, res, next) => {
  try {
    const { name, mongoFilter, messageTemplate, audienceSize } = req.body;

    // 1. Create a segment
    const segment = await Segment.create({
      name: `Segment for ${name}`,
      naturalLanguageQuery: 'Generated via Direct Launch',
      mongoFilter,
      audienceSize,
      explanation: 'Direct Launch',
      createdBy: req.user._id,
    });

    // 2. Create the campaign
    const campaign = await Campaign.create({
      name,
      segmentId: segment._id,
      channel: 'WhatsApp',
      contentTemplate: messageTemplate,
      status: 'Scheduled',
      audienceSize,
      createdBy: req.user._id,
    });

    // Enqueue via BullMQ (falls back to synchronous if Redis unavailable)
    await enqueueCampaign(campaign._id);

    res.json({ message: 'Campaign launched successfully', campaign });
  } catch (error) {
    next(error);
  }
};

// @desc    Get communications for a campaign
// @route   GET /api/campaigns/:id/communications
// @access  Private
export const getCampaignCommunications = async (req, res, next) => {
  try {
    const communications = await Communication.find({ campaignId: req.params.id })
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(communications);
  } catch (error) {
    next(error);
  }
};
