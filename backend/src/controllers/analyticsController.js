import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Campaign from '../models/Campaign.js';
import Communication from '../models/Communication.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const INDIAN_FIRST_NAMES = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Siddharth', 'Rahul', 'Rohan', 'Amit', 'Neha', 'Pooja', 'Anjali', 'Sneha', 'Kavya', 'Priya', 'Riya', 'Aisha', 'Simran', 'Ishita', 'Ravi', 'Deepika', 'Kiran', 'Meera', 'Suresh', 'Lakshmi'];
const INDIAN_LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Rao', 'Das', 'Bose', 'Kapoor', 'Malhotra', 'Jain', 'Mehta', 'Nair', 'Iyer', 'Pillai', 'Chandra', 'Saxena'];
const PRODUCT_CATALOG = [
  { name: 'Running Shoes', category: 'Footwear', price: 2499 },
  { name: 'Yoga Mat', category: 'Fitness', price: 799 },
  { name: 'Protein Powder', category: 'Nutrition', price: 1999 },
  { name: 'Cotton T-Shirt', category: 'Apparel', price: 599 },
  { name: 'Leather Wallet', category: 'Accessories', price: 1299 },
  { name: 'Bluetooth Earbuds', category: 'Electronics', price: 3499 },
  { name: 'Backpack', category: 'Bags', price: 1799 },
  { name: 'Water Bottle', category: 'Fitness', price: 449 },
  { name: 'Face Cream', category: 'Beauty', price: 699 },
  { name: 'Jeans', category: 'Apparel', price: 1499 },
];

// @desc    Get dashboard metrics & AI Insights
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [totalCustomers, totalOrders, revenueAgg, activeCampaigns] = await Promise.all([
      Customer.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, totalRevenue: { $sum: '$amount' } } }]),
      Campaign.countDocuments({ status: { $in: ['Running', 'Scheduled'] } }),
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Generate AI Insights — with a hard 5s timeout so dashboard never hangs
    let aiInsight = '';
    
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are an AI Marketing Analyst. Metrics: Customers: ${totalCustomers}, Orders: ${totalOrders}, Revenue: ₹${totalRevenue}, Active Campaigns: ${activeCampaigns}. Write exactly 2 sentences of actionable marketing insight. Be specific and data-driven.`;
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 5000)
        );
        const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
        aiInsight = result.response.text().trim();
      } catch (e) {
        console.error('AI Insight Error:', e.message);
      }
    }

    // Fallback insight based on real data
    if (!aiInsight) {
      if (totalCustomers === 0) {
        aiInsight = 'No customer data yet. Click "Generate Seed Data" to populate the database with sample customers and orders.';
      } else {
        const avgClv = totalRevenue / Math.max(totalCustomers, 1);
        aiInsight = `Your ${totalCustomers.toLocaleString()} customers have generated ₹${totalRevenue.toLocaleString()} in revenue with an average CLV of ₹${Math.round(avgClv).toLocaleString()}. Consider launching a re-engagement WhatsApp campaign targeting high-CLV customers who haven't purchased in 30+ days.`;
      }
    }

    res.json({
      metrics: { totalCustomers, totalOrders, totalRevenue, activeCampaigns },
      aiInsight,
    });
  } catch (error) {
    next(error);
  }
};

export const seedData = async (req, res, next) => {
  try {
    // Clear existing data
    await Promise.all([
      Customer.deleteMany({}),
      Order.deleteMany({}),
      Campaign.deleteMany({}),
      Communication.deleteMany({}),
    ]);

    // Create 500 customers
    const customersToInsert = [];
    for (let i = 0; i < 500; i++) {
      const fn = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
      const ln = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)];
      const genders = ['Male', 'Female', 'Other'];
      const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat'];
      customersToInsert.push({
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@example.com`,
        phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender: genders[Math.floor(Math.random() * genders.length)],
        age: Math.floor(18 + Math.random() * 50),
        location: locations[Math.floor(Math.random() * locations.length)],
        clv: 0,
        totalOrders: 0,
        lastPurchaseDate: null,
        optInWhatsApp: Math.random() > 0.1,
        optInEmail: Math.random() > 0.05,
        optInSMS: Math.random() > 0.2,
      });
    }

    const insertedCustomers = await Customer.insertMany(customersToInsert);

    // Create 5000 orders with CORRECT field names: customerId + orderDate
    const ordersToInsert = [];
    const now = new Date();

    for (let i = 0; i < 5000; i++) {
      const customer = insertedCustomers[Math.floor(Math.random() * insertedCustomers.length)];
      // Orders spread over last 365 days
      const orderDate = new Date(now.getTime() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
      const numProducts = Math.floor(1 + Math.random() * 3);
      const products = [];
      let amount = 0;
      for (let p = 0; p < numProducts; p++) {
        const product = PRODUCT_CATALOG[Math.floor(Math.random() * PRODUCT_CATALOG.length)];
        const qty = Math.floor(1 + Math.random() * 3);
        products.push({ name: product.name, category: product.category, price: product.price, quantity: qty });
        amount += product.price * qty;
      }
      const statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Pending', 'Refunded', 'Cancelled'];
      ordersToInsert.push({
        customerId: customer._id, // ✅ correct field name
        amount,
        products,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        orderDate, // ✅ correct field name
      });
    }

    await Order.insertMany(ordersToInsert);

    // Sync customer stats from orders
    const stats = await Order.aggregate([
      { $match: { status: { $in: ['Completed', 'Pending'] } } },
      {
        $group: {
          _id: '$customerId',
          totalOrders: { $sum: 1 },
          clv: { $sum: '$amount' },
          lastPurchaseDate: { $max: '$orderDate' },
        },
      },
    ]);

    if (stats.length > 0) {
      const bulkOps = stats.map((stat) => ({
        updateOne: {
          filter: { _id: stat._id },
          update: { $set: { totalOrders: stat.totalOrders, clv: stat.clv, lastPurchaseDate: stat.lastPurchaseDate } },
        },
      }));
      await Customer.bulkWrite(bulkOps);
    }

    res.json({ message: `Seeded successfully: 500 customers and ${ordersToInsert.length} orders.` });
  } catch (error) {
    next(error);
  }
};

export const getChartsData = async (req, res, next) => {
  try {
    // 1. Communication Funnel
    const commsStats = await Communication.aggregate([
      {
        $group: {
          _id: null,
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $eq: ['$status', 'Opened'] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ['$status', 'Clicked'] }, 1, 0] } },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]);

    let funnelData = [
      { name: 'Sent', value: 0, fill: '#6366f1' },
      { name: 'Delivered', value: 0, fill: '#3b82f6' },
      { name: 'Opened', value: 0, fill: '#8b5cf6' },
      { name: 'Clicked', value: 0, fill: '#a855f7' },
      { name: 'Converted', value: 0, fill: '#10b981' },
    ];

    if (commsStats.length > 0) {
      const s = commsStats[0];
      const converted = s.converted;
      const clicked = s.clicked + converted;
      const opened = s.opened + clicked;
      const delivered = s.delivered + opened;
      const sent = s.total - s.failed;
      funnelData = [
        { name: 'Sent', value: sent, fill: '#6366f1' },
        { name: 'Delivered', value: delivered, fill: '#3b82f6' },
        { name: 'Opened', value: opened, fill: '#8b5cf6' },
        { name: 'Clicked', value: clicked, fill: '#a855f7' },
        { name: 'Converted', value: converted, fill: '#10b981' },
      ];
    }

    // 2. Revenue Trend (Last 6 Months) — uses correct field: orderDate
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueTrend = await Order.aggregate([
      { $match: { orderDate: { $gte: sixMonthsAgo }, status: { $in: ['Completed', 'Pending'] } } },
      {
        $group: {
          _id: { month: { $month: '$orderDate' }, year: { $year: '$orderDate' } },
          revenue: { $sum: '$amount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedRevenueTrend = revenueTrend.map((rt) => ({
      name: `${monthNames[rt._id.month - 1]} '${rt._id.year.toString().slice(2)}`,
      revenue: rt.revenue,
      orders: rt.orders,
    }));

    // 3. Campaign Comparison — use real communication counts
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).limit(6);
    const campaignIds = campaigns.map((c) => c._id);
    const commCounts = await Communication.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      {
        $group: {
          _id: '$campaignId',
          engaged: {
            $sum: {
              $cond: [{ $in: ['$status', ['Opened', 'Clicked', 'Converted']] }, 1, 0],
            },
          },
        },
      },
    ]);
    const commMap = {};
    commCounts.forEach((c) => { commMap[c._id.toString()] = c.engaged; });

    const campaignComparison = campaigns.map((c) => ({
      name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name,
      audienceSize: c.audienceSize,
      engaged: commMap[c._id.toString()] || 0,
    }));

    res.json({ funnel: funnelData, revenueTrend: formattedRevenueTrend, campaignComparison });
  } catch (error) {
    next(error);
  }
};
