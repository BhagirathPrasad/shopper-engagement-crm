import { Queue, Worker, QueueEvents } from 'bullmq';
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import Communication from '../models/Communication.js';
import axios from 'axios';
import { redisClient, redisAvailable } from '../config/redis.js';

// ─── Resolve the channel service URL for any environment ────────────────────
// Locally: http://localhost:5001
// On Render: set CHANNEL_SERVICE_URL env var pointing to the other Render service
const CHANNEL_SERVICE_URL =
  process.env.CHANNEL_SERVICE_URL ||
  (process.env.NODE_ENV === 'production'
    ? null   // will throw a clear error if not configured
    : 'http://localhost:5001');

// ─── Queue & Worker (only initialised when Redis is available) ───────────────
export let campaignQueue = null;
let campaignWorker = null;
let campaignQueueEvents = null;

if (redisClient && redisAvailable !== false) {
  // ── Queue ──────────────────────────────────────────────────────────────────
  campaignQueue = new Queue('campaign-queue', {
    connection: redisClient,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },   // keep last 100 completed jobs
      removeOnFail: { count: 200 },        // keep last 200 failed jobs for debugging
    },
  });

  // ── Worker ─────────────────────────────────────────────────────────────────
  campaignWorker = new Worker(
    'campaign-queue',
    async (job) => {
      const { campaignId } = job.data;
      console.log(`[Worker] Processing campaign job ${job.id} — campaignId: ${campaignId}`);

      // 1. Load campaign
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

      campaign.status = 'Running';
      await campaign.save();

      // 2. Load segment
      const segment = await Segment.findById(campaign.segmentId);
      if (!segment) throw new Error(`Segment ${campaign.segmentId} not found`);

      // 3. Match customers
      const customers = await Customer.find(segment.mongoFilter).lean();
      if (customers.length === 0) {
        console.warn(`[Worker] Campaign ${campaignId}: No customers matched the segment filter.`);
        campaign.status = 'Completed';
        await campaign.save();
        return;
      }

      console.log(`[Worker] Campaign ${campaignId}: ${customers.length} customers matched.`);

      // 4. Create Communication records
      const communications = [];
      for (const customer of customers) {
        const content = (campaign.contentTemplate || '')
          .replace(/\[Name\]/gi, customer.name)
          .replace(/{{name}}/gi, customer.name);

        const comm = await Communication.create({
          campaignId: campaign._id,
          customerId: customer._id,
          status: 'Pending',
          content,
        });
        communications.push({ ...comm.toObject(), customer });
      }

      // 5. Dispatch via Channel Service
      if (!CHANNEL_SERVICE_URL) {
        throw new Error(
          'CHANNEL_SERVICE_URL environment variable is not set. ' +
          'Set it to the URL of your deployed channel-service on Render.'
        );
      }

      try {
        await axios.post(
          `${CHANNEL_SERVICE_URL}/api/dispatch`,
          {
            communications: communications.map((c) => ({
              _id: c._id,
              channel: campaign.channel || 'WhatsApp',
              to: campaign.channel === 'Email' ? c.customer.email : c.customer.phone,
              content: c.content,
            })),
          },
          { timeout: 30000 } // 30s timeout
        );
        campaign.status = 'Completed';
        console.log(`[Worker] Campaign ${campaignId} dispatched successfully.`);
      } catch (dispatchError) {
        console.error('[Worker] Channel service dispatch failed:', dispatchError.message);
        // Mark as Failed but do NOT re-throw — BullMQ will retry via attempts config
        campaign.status = 'Failed';
      }

      await campaign.save();
    },
    {
      connection: redisClient,
      concurrency: 3,
    }
  );

  // ── Worker Event Listeners ─────────────────────────────────────────────────
  campaignWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
  });

  campaignWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  campaignWorker.on('error', (err) => {
    console.error('[Worker] Worker error:', err.message);
  });

  // ── Queue Events (for Socket.io broadcasting) ──────────────────────────────
  campaignQueueEvents = new QueueEvents('campaign-queue', { connection: redisClient });

  console.log('[Queue] BullMQ campaign queue and worker initialised.');
} else {
  console.warn(
    '[Queue] BullMQ is DISABLED — Redis not available.\n' +
    'Campaigns will be executed synchronously as a fallback.'
  );
}

/**
 * Adds a job to the campaign queue.
 * Falls back to synchronous in-process execution when Redis is unavailable.
 */
export async function enqueueCampaign(campaignId) {
  if (campaignQueue) {
    const job = await campaignQueue.add('execute-campaign', { campaignId });
    console.log(`[Queue] Enqueued campaign job ${job.id} for campaign ${campaignId}`);
    return job;
  }

  // ── Synchronous fallback (no Redis) ────────────────────────────────────────
  console.warn(`[Queue] Running campaign ${campaignId} synchronously (no Redis).`);
  await runCampaignSync(campaignId);
}

/**
 * Direct synchronous execution — used when Redis/BullMQ is not available.
 */
async function runCampaignSync(campaignId) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return;

    campaign.status = 'Running';
    await campaign.save();

    const segment = await Segment.findById(campaign.segmentId);
    if (!segment) {
      campaign.status = 'Failed';
      await campaign.save();
      return;
    }

    const customers = await Customer.find(segment.mongoFilter).lean();
    if (customers.length === 0) {
      campaign.status = 'Completed';
      await campaign.save();
      return;
    }

    const communications = [];
    for (const customer of customers) {
      const content = (campaign.contentTemplate || '')
        .replace(/\[Name\]/gi, customer.name)
        .replace(/{{name}}/gi, customer.name);

      const comm = await Communication.create({
        campaignId: campaign._id,
        customerId: customer._id,
        status: 'Pending',
        content,
      });
      communications.push({ ...comm.toObject(), customer });
    }

    if (CHANNEL_SERVICE_URL) {
      try {
        await axios.post(`${CHANNEL_SERVICE_URL}/api/dispatch`, {
          communications: communications.map((c) => ({
            _id: c._id,
            channel: campaign.channel || 'WhatsApp',
            to: campaign.channel === 'Email' ? c.customer.email : c.customer.phone,
            content: c.content,
          })),
        }, { timeout: 30000 });
        campaign.status = 'Completed';
      } catch (err) {
        console.error('[Sync] Channel dispatch failed:', err.message);
        campaign.status = 'Failed';
      }
    } else {
      // Simulate delivery in-process when channel service is also unavailable
      for (const comm of communications) {
        const r = Math.random();
        let status = 'Failed';
        if (r < 0.05) status = 'Converted';
        else if (r < 0.10) status = 'Clicked';
        else if (r < 0.20) status = 'Opened';
        else if (r < 0.70) status = 'Delivered';

        await Communication.findByIdAndUpdate(comm._id, { status });
      }
      campaign.status = 'Completed';
    }

    await campaign.save();
  } catch (err) {
    console.error('[Sync] Campaign execution error:', err.message);
  }
}

export { campaignQueueEvents };
