import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(cors());

// Mock Dispatch endpoint
app.post('/api/dispatch', async (req, res) => {
  const { communications } = req.body;
  
  if (!communications || !Array.isArray(communications)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Accept the request immediately (Async processing simulation)
  res.status(202).json({ message: 'Accepted for delivery', count: communications.length });

  // Simulate async processing
  setTimeout(async () => {
    for (const comm of communications) {
      const { _id, channel, to } = comm;
      
      const r = Math.random();
      let status = 'Failed';
      if (r < 0.05) status = 'Converted';
      else if (r < 0.15) status = 'Clicked'; // 10% clicked (0.05 to 0.15)
      else if (r < 0.35) status = 'Opened'; // 20% opened (0.15 to 0.35)
      else if (r < 0.95) status = 'Delivered'; // 60% delivered only (0.35 to 0.95), meaning total 95% delivered
      
      // The requirement was: 70% delivered, 20% opened, 10% clicked, 5% converted
      // Assuming these are funnel percentages out of 100% total:
      // Converted: 5%
      // Clicked (but not converted): 10% - 5% = 5%
      // Opened (but not clicked): 20% - 10% = 10%
      // Delivered (but not opened): 70% - 20% = 50%
      // Failed: 30%
      
      if (r < 0.05) status = 'Converted';
      else if (r < 0.10) status = 'Clicked';
      else if (r < 0.20) status = 'Opened';
      else if (r < 0.70) status = 'Delivered';
      else status = 'Failed';

      console.log(`[${channel}] ${status} to ${to} (ID: ${_id})`);

      // Callback to CRM Service via webhook
      try {
        await axios.post('http://localhost:5000/api/webhooks/delivery', {
          communicationId: _id,
          status,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to notify CRM via webhook:', error.message);
      }

      // Simulate slight delay between each message
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }, 1000); // 1s initial delay
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Channel Service running on port ${PORT}`);
});
