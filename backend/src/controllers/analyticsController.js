import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import Communication from '../models/Communication.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_now');

// @desc    Get dashboard metrics & AI Insights
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Quick aggregation for Revenue
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    const activeCampaigns = await Campaign.countDocuments({ status: { $in: ['Running', 'Scheduled'] } });

    // Generate AI Insights
    let aiInsight = "Revenue is steady, but dormant high-value customers could be re-engaged with a WhatsApp campaign.";
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = `
        You are an AI Marketing Analyst. Here are the current metrics:
        - Total Customers: ${totalCustomers}
        - Total Orders: ${totalOrders}
        - Total Revenue: ₹${totalRevenue}
        - Active Campaigns: ${activeCampaigns}

        Write a 2-sentence actionable insight for the marketer to improve their strategy. Focus on ROI or retention.
      `;
      const result = await model.generateContent(prompt);
      aiInsight = result.response.text();
    } catch (e) {
      console.error("AI Insight Generation Error:", e);
    }

    res.json({
      metrics: {
        totalCustomers,
        totalOrders,
        totalRevenue,
        activeCampaigns
      },
      aiInsight
    });
  } catch (error) {
    next(error);
  }
};

const INDIAN_FIRST_NAMES = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Siddharth', 'Rahul', 'Rohan', 'Amit', 'Neha', 'Pooja', 'Anjali', 'Sneha', 'Kavya', 'Priya', 'Riya', 'Aisha', 'Simran', 'Ishita'];
const INDIAN_LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Rao', 'Das', 'Bose', 'Kapoor', 'Malhotra', 'Jain', 'Mehta', 'Nair'];

export const seedData = async (req, res, next) => {
  try {
    // Clear existing collections
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await Communication.deleteMany({});

    const customersToInsert = [];
    for (let i = 0; i < 500; i++) {
      const fn = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
      const ln = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)];
      customersToInsert.push({
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 1000)}@example.com`,
        phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        clv: 0,
        totalOrders: 0,
        lastPurchaseDate: null
      });
    }

    const insertedCustomers = await Customer.insertMany(customersToInsert);

    const ordersToInsert = [];
    for (let i = 0; i < 5000; i++) {
      const customer = insertedCustomers[Math.floor(Math.random() * insertedCustomers.length)];
      const now = new Date();
      // Random date in the last 365 days
      const purchaseDate = new Date(now.getTime() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
      ordersToInsert.push({
        customer: customer._id,
        amount: Math.floor(500 + Math.random() * 9500),
        status: 'Completed',
        purchaseDate
      });
    }

    await Order.insertMany(ordersToInsert);

    // Sync Customer stats
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          clv: { $sum: '$amount' },
          lastPurchaseDate: { $max: '$purchaseDate' }
        }
      }
    ]);

    const bulkOps = stats.map(stat => ({
      updateOne: {
        filter: { _id: stat._id },
        update: {
          $set: {
            totalOrders: stat.totalOrders,
            clv: stat.clv,
            lastPurchaseDate: stat.lastPurchaseDate
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await Customer.bulkWrite(bulkOps);
    }

    res.json({ message: 'Seed data generated successfully: 500 customers and 5000 orders.' });
  } catch (error) {
    next(error);
  }
};

export const getChartsData = async (req, res, next) => {
  try {
    // 1. Funnel Chart (Communication Lifecycle)
    // We aggregate all communications
    const commsStats = await Communication.aggregate([
      {
        $group: {
          _id: null,
          sent: { $sum: { $cond: [{ $eq: ['$status', 'Sent'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $eq: ['$status', 'Opened'] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ['$status', 'Clicked'] }, 1, 0] } },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
        }
      }
    ]);

    let funnelData = [
      { name: 'Sent', value: 0 },
      { name: 'Delivered', value: 0 },
      { name: 'Opened', value: 0 },
      { name: 'Clicked', value: 0 },
      { name: 'Converted', value: 0 }
    ];

    if (commsStats.length > 0) {
      const stats = commsStats[0];
      // Note: Because a converted message was previously clicked, opened, delivered and sent, 
      // we sum them cumulatively for a proper funnel if they are terminal statuses, 
      // but in our system they might overwrite. Wait, our channel service updates the same record.
      // So if status is 'Converted', it means it went through all stages.
      // Let's assume the statuses are mutually exclusive terminal states for now, so we aggregate them cumulatively:
      const converted = stats.converted;
      const clicked = stats.clicked + converted;
      const opened = stats.opened + clicked;
      const delivered = stats.delivered + opened;
      const sent = stats.sent + delivered + stats.failed;

      funnelData = [
        { name: 'Sent', value: sent },
        { name: 'Delivered', value: delivered },
        { name: 'Opened', value: opened },
        { name: 'Clicked', value: clicked },
        { name: 'Converted', value: converted }
      ];
    }

    // 2. Revenue Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const revenueTrend = await Order.aggregate([
      { $match: { purchaseDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$purchaseDate" }, year: { $year: "$purchaseDate" } },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedRevenueTrend = revenueTrend.map(rt => ({
      name: `${monthNames[rt._id.month - 1]} ${rt._id.year.toString().slice(2)}`,
      revenue: rt.revenue
    }));

    // 3. Campaign Comparison
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).limit(5);
    const campaignComparison = campaigns.map(c => ({
      name: c.name,
      audienceSize: c.audienceSize,
      engaged: Math.floor(c.audienceSize * Math.random() * 0.4) // Mock engagement for now
    }));

    res.json({
      funnel: funnelData,
      revenueTrend: formattedRevenueTrend,
      campaignComparison
    });
  } catch (error) {
    next(error);
  }
};
