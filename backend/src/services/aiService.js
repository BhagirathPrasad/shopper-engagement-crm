import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateMongoFilter = async (query) => {
  // If no valid API key, return a smart rule-based fallback
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return buildFallbackFilter(query);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an AI assistant for a marketing CRM. Translate a marketer's natural language query into a MongoDB query object for Mongoose.

Customer schema fields:
- name (String)
- email (String)
- phone (String)
- gender (String: 'Male', 'Female', 'Other')
- age (Number)
- location (String)
- lastPurchaseDate (Date)
- clv (Number - Customer Lifetime Value in INR)
- totalOrders (Number)
- optInWhatsApp (Boolean)
- optInEmail (Boolean)
- optInSMS (Boolean)

Marketer's query: "${query}"

Today's date is: ${new Date().toISOString()}

Return ONLY a raw JSON object (no markdown, no code blocks) with exactly these three fields:
{
  "mongoFilter": { ... valid mongoose query ... },
  "explanation": "1-2 sentence human-readable explanation",
  "messageTemplate": "Personalized WhatsApp message under 160 chars with [Name] placeholder"
}`;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), 10000)
    );
    const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
    let responseText = result.response.text().trim();

    // Robust markdown stripping
    responseText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Extract JSON if there's surrounding text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    const parsed = JSON.parse(responseText);
    
    // Validate required fields
    if (!parsed.mongoFilter || !parsed.explanation || !parsed.messageTemplate) {
      throw new Error('Invalid AI response structure');
    }

    return parsed;
  } catch (error) {
    console.error('AI Generation Error:', error.message);
    // Fall back to rule-based filter
    return buildFallbackFilter(query);
  }
};

// Rule-based fallback when AI is unavailable
function buildFallbackFilter(query) {
  const q = query.toLowerCase();
  
  let mongoFilter = {};
  let explanation = '';
  let messageTemplate = '';

  if (q.includes('high value') || q.includes('high clv') || q.includes('spent over') || q.includes('big spender')) {
    const amountMatch = q.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[1]) : 5000;
    mongoFilter = { clv: { $gt: amount } };
    explanation = `Customers with total lifetime spending over ₹${amount.toLocaleString()}.`;
    messageTemplate = `Hi [Name]! As a valued customer, enjoy exclusive 20% off your next purchase. Code: VIP20 🎁`;
  } else if (q.includes('inactive') || q.includes('dormant') || q.includes('haven\'t') || q.includes('not purchased')) {
    const days = q.match(/(\d+)\s*day/)?.[1] || 60;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    mongoFilter = { lastPurchaseDate: { $lt: cutoff } };
    explanation = `Customers who haven't purchased in the last ${days} days.`;
    messageTemplate = `Hi [Name]! We miss you! Come back and get 15% off with code MISSYOU 💙`;
  } else if (q.includes('new customer') || q.includes('first time')) {
    mongoFilter = { totalOrders: { $lte: 1 } };
    explanation = 'New customers with 1 or fewer orders.';
    messageTemplate = `Hi [Name]! Welcome! Enjoy free shipping on your next order. Code: NEWBIE 🎉`;
  } else if (q.includes('mumbai') || q.includes('delhi') || q.includes('bangalore') || q.includes('chennai')) {
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune'].filter(c => q.includes(c.toLowerCase()));
    mongoFilter = { location: { $in: cities.length ? cities : ['Mumbai'] } };
    explanation = `Customers located in ${cities.join(', ') || 'Mumbai'}.`;
    messageTemplate = `Hi [Name]! Special offer for ${cities[0] || 'you'} customers! Get 10% off today. Code: LOCAL10 🏙️`;
  } else if (q.includes('whatsapp') || q.includes('opt in')) {
    mongoFilter = { optInWhatsApp: true };
    explanation = 'Customers opted in to WhatsApp communications.';
    messageTemplate = `Hi [Name]! Exciting news - check out our latest collection just for you! 🛍️`;
  } else {
    // Generic: all active customers
    mongoFilter = { totalOrders: { $gte: 1 } };
    explanation = 'All customers who have made at least one purchase.';
    messageTemplate = `Hi [Name]! We have something special for you. Check out our latest offers! 🎊`;
  }

  return { mongoFilter, explanation, messageTemplate };
}
