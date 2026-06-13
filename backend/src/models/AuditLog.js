import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g., 'CREATED_CAMPAIGN', 'UPDATED_SEGMENT'
    entityType: { type: String, required: true }, // e.g., 'Campaign', 'Segment', 'Customer'
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: Object }, // Before/After state or action payload
  },
  { timestamps: true }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
