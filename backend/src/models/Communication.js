import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    status: { type: String, enum: ['Pending', 'Sent', 'Delivered', 'Failed', 'Opened', 'Read', 'Clicked', 'Converted'], default: 'Pending' },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Communication = mongoose.model('Communication', communicationSchema);
export default Communication;
