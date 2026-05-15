import mongoose, { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, default: 'Service' }, // e.g. Service or Item
  createdAt: { type: Date, default: Date.now },
});

export const Product = models.Product || model('Product', ProductSchema);
