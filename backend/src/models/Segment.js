import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    naturalLanguageQuery: { type: String, required: true },
    mongoFilter: { type: Object, required: true },
    audienceSize: { type: Number, default: 0 },
    explanation: { type: String }, // AI explanation of the generated filter
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Segment = mongoose.model('Segment', segmentSchema);
export default Segment;
