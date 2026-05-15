import mongoose, { Schema, model, models } from 'mongoose';

const OrderSchema = new Schema({
  customerName: { type: String, required: true },
  customerPhone: String,
  items: [{ name: String, price: Number }],
  totalAmount: { type: Number, required: true },
  advancePaid: { type: Number, default: 0 },
  paymentStep: { type: Number, default: 1 },
  status: { type: String, enum: ['PARTIAL', 'COMPLETED'], default: 'PARTIAL' },
  createdAt: { type: Date, default: Date.now },
});

export const Order = models.Order || model('Order', OrderSchema);