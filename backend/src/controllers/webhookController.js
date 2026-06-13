import Communication from '../models/Communication.js';
import CommunicationEvent from '../models/CommunicationEvent.js';

// @desc    Handle channel service delivery webhooks
// @route   POST /api/webhooks/delivery
// @access  Public
export const handleDeliveryWebhook = async (req, res, next) => {
  try {
    const { communicationId, status, timestamp } = req.body;

    const comm = await Communication.findById(communicationId);
    if (!comm) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    comm.status = status;
    await comm.save();

    await CommunicationEvent.create({
      communicationId,
      eventType: status,
      details: { timestamp }
    });

    // Emit socket event to frontend
    const io = req.app.get('io');
    if (io) {
      io.emit('campaign-update', {
        campaignId: comm.campaignId,
        communicationId,
        status
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
