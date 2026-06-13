import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Segment' },
    channel: { type: String, enum: ['WhatsApp', 'Email', 'SMS', 'RCS'], required: true, default: 'WhatsApp' },
    contentTemplate: { type: String, required: true },
    status: { type: String, enum: ['Draft', 'Scheduled', 'Running', 'Completed', 'Failed'], default: 'Draft' },
    scheduledAt: { type: Date },
    audienceSize: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
