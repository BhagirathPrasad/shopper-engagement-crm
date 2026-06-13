import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import Communication from '../models/Communication.js';
import axios from 'axios';

const redisConnection = new Redis(process.env.REDIS_URI || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const campaignQueue = new Queue('campaign-queue', { connection: redisConnection });

const worker = new Worker('campaign-queue', async (job) => {
  const { campaignId } = job.data;
  
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'Running';
    await campaign.save();

    const segment = await Segment.findById(campaign.segmentId);
    if (!segment) throw new Error('Segment not found');

    // Find all customers matching the segment filter
    const customers = await Customer.find(segment.mongoFilter).lean();

    const communications = [];
    for (const customer of customers) {
      // Personalize message (naive implementation)
      const message = campaign.contentTemplate.replace('{{name}}', customer.name);

      const comm = await Communication.create({
        campaignId: campaign._id,
        customerId: customer._id,
        status: 'Pending',
        content: message
      });
      communications.push(comm);
    }

    // Send payload to Channel Service
    try {
      await axios.post('http://localhost:5001/api/dispatch', {
        communications: communications.map(c => ({
          _id: c._id,
          channel: campaign.channel,
          to: campaign.channel === 'Email' ? c.customerId.email : c.customerId.phone, // simplistic
          content: c.content
        }))
      });
      campaign.status = 'Completed';
    } catch (error) {
      console.error('Channel service error:', error.message);
      campaign.status = 'Failed';
    }

    await campaign.save();

  } catch (error) {
    console.error('Campaign worker error:', error);
  }
}, { connection: redisConnection });

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});
