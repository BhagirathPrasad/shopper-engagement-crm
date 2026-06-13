import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import { generateMongoFilter } from '../services/aiService.js';

// @desc    Build segment via AI
// @route   POST /api/segments/build
// @access  Private
export const buildSegment = async (req, res, next) => {
  try {
    const { query } = req.body;
    
    // Generate filter and explanation from AI
    const aiResponse = await generateMongoFilter(query);
    const { mongoFilter, explanation, messageTemplate } = aiResponse;

    // Estimate audience size
    const audienceSize = await Customer.countDocuments(mongoFilter);

    // Estimate engagement rate (e.g. smaller segments have higher engagement)
    const baseRate = 35;
    const penalty = Math.min(20, (audienceSize / 500) * 10);
    const engagementRate = Math.max(5, Math.floor(baseRate - penalty)) + '%';

    res.json({
      naturalLanguageQuery: query,
      mongoFilter,
      explanation,
      messageTemplate,
      audienceSize,
      engagementRate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save a segment
// @route   POST /api/segments
// @access  Private
export const saveSegment = async (req, res, next) => {
  try {
    const { name, naturalLanguageQuery, mongoFilter, audienceSize, explanation } = req.body;

    const segment = await Segment.create({
      name,
      naturalLanguageQuery,
      mongoFilter,
      audienceSize,
      explanation,
      createdBy: req.user._id,
    });

    res.status(201).json(segment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all segments
// @route   GET /api/segments
// @access  Private
export const getSegments = async (req, res, next) => {
  try {
    const segments = await Segment.find().sort({ createdAt: -1 });
    res.json(segments);
  } catch (error) {
    next(error);
  }
};
