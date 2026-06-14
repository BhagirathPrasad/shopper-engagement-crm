import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(cors());

// ─── Resolve Backend CRM URL ─────────────────────────────────────────────────
// Locally: http://localhost:5050
// On Render: set BACKEND_URL to your backend Render service URL
// e.g. https://xeno-crm-backend.onrender.com
const BACKEND_URL =
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === 'production'
    ? null
    : 'http://localhost:5050');

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'Channel Service is running', backendUrl: BACKEND_URL || 'NOT CONFIGURED' });
});

// Mock Dispatch endpoint
app.post('/api/dispatch', async (req, res) => {
  const { communications } = req.body;

  if (!communications || !Array.isArray(communications)) {
    return res.status(400).json({ error: 'Invalid payload: expected { communications: [] }' });
  }

  if (!BACKEND_URL) {
    console.error('[Channel Service] BACKEND_URL is not set — cannot send webhook callbacks.');
    return res.status(500).json({ error: 'BACKEND_URL environment variable not configured' });
  }

  // Accept immediately — simulate async delivery
  res.status(202).json({ message: 'Accepted for delivery', count: communications.length });

  // Simulate async delivery processing
  setTimeout(async () => {
    for (const comm of communications) {
      const { _id, channel, to } = comm;

      // Realistic delivery funnel:
      // 30% fail, 50% delivered, 10% opened, 5% clicked, 5% converted
      const r = Math.random();
      let status;
      if (r < 0.05) status = 'Converted';
      else if (r < 0.10) status = 'Clicked';
      else if (r < 0.20) status = 'Opened';
      else if (r < 0.70) status = 'Delivered';
      else status = 'Failed';

      console.log(`[${channel}] ${status} → ${to} (comm: ${_id})`);

      // Webhook callback to CRM backend
      try {
        await axios.post(
          `${BACKEND_URL}/api/webhooks/delivery`,
          { communicationId: _id, status, timestamp: new Date() },
          { timeout: 10000 }
        );
      } catch (err) {
        console.error(`[Channel Service] Webhook failed for comm ${_id}:`, err.message);
      }

      // Slight delay between messages (avoid hammering the backend)
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }, 1000);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Channel Service running on port ${PORT}`);
  if (BACKEND_URL) {
    console.log(`  → Webhook callbacks → ${BACKEND_URL}`);
  } else {
    console.warn('  → WARNING: BACKEND_URL is not set. Webhook callbacks will fail.');
  }
});
