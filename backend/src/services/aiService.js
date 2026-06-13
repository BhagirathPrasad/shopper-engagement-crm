import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_now');

export const generateMongoFilter = async (query) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `
    You are an AI assistant for a marketing CRM. Your job is to translate a marketer's natural language request into a valid MongoDB query object for Mongoose.
    
    The Customer schema has these fields:
    - name (String)
    - email (String)
    - phone (String)
    - gender (String: 'Male', 'Female', 'Other')
    - age (Number)
    - location (String)
    - lastPurchaseDate (Date)
    - clv (Number - Customer Lifetime Value)
    - totalOrders (Number)
    - optInWhatsApp (Boolean)
    - optInEmail (Boolean)
    - optInSMS (Boolean)
    
    The marketer's query is: "${query}"
    
    Return a JSON object containing three fields:
    1. "mongoFilter": A valid MongoDB query object that can be passed to Customer.find(mongoFilter). Do NOT use any markdown formatting or code blocks in the output. Just the raw JSON.
    2. "explanation": A short, 1-2 sentence human-readable explanation of what this filter does.
    3. "messageTemplate": A personalized, highly engaging WhatsApp/SMS message template targeting this exact segment. Include placeholders like [Name]. Keep it under 160 characters if possible.

    Output format MUST be strictly parsable JSON like this:
    {
      "mongoFilter": { "clv": { "$gt": 5000 }, "lastPurchaseDate": { "$lt": "2024-01-01T00:00:00.000Z" } },
      "explanation": "Customers who have spent more than ₹5000 and haven't purchased since Jan 1, 2024.",
      "messageTemplate": "Hi [Name]! We miss you. Use code WELCOMEBACK for 20% off your next order."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt to parse the JSON. We might need to strip markdown if the model hallucinates it despite instructions.
    let cleanText = responseText;
    if (cleanText.startsWith('\`\`\`json')) {
      cleanText = cleanText.replace('\`\`\`json', '').replace('\`\`\`', '').trim();
    } else if (cleanText.startsWith('\`\`\`')) {
      cleanText = cleanText.replace('\`\`\`', '').replace('\`\`\`', '').trim();
    }
    
    const parsed = JSON.parse(cleanText);
    return parsed;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error('Failed to generate segment filter from AI');
  }
};
