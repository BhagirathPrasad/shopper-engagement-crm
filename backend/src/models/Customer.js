import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    age: { type: Number },
    location: { type: String },
    lastPurchaseDate: { type: Date },
    clv: { type: Number, default: 0 }, // Customer Lifetime Value
    totalOrders: { type: Number, default: 0 },
    optInWhatsApp: { type: Boolean, default: true },
    optInEmail: { type: Boolean, default: true },
    optInSMS: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for faster querying in segments
customerSchema.index({ clv: -1 });
customerSchema.index({ lastPurchaseDate: -1 });
customerSchema.index({ totalOrders: -1 });
customerSchema.index({ age: 1 });
customerSchema.index({ gender: 1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
