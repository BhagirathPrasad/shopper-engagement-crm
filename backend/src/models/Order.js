import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    products: [
      {
        name: { type: String, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
      },
    ],
    status: { type: String, enum: ['Pending', 'Completed', 'Cancelled', 'Refunded'], default: 'Completed' },
    orderDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

orderSchema.index({ 'products.category': 1 }); // Useful for segmenting by product categories purchased

const Order = mongoose.model('Order', orderSchema);
export default Order;
