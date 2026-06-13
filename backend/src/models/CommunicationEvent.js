import mongoose from 'mongoose';

const communicationEventSchema = new mongoose.Schema(
  {
    communicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Communication', required: true, index: true },
    eventType: { type: String, enum: ['Sent', 'Delivered', 'Failed', 'Opened', 'Read', 'Clicked'], required: true },
    details: { type: Object },
  },
  { timestamps: true }
);

const CommunicationEvent = mongoose.model('CommunicationEvent', communicationEventSchema);
export default CommunicationEvent;
