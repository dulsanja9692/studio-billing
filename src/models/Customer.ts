import mongoose, { Schema, model, models } from 'mongoose';

const CustomerSchema = new Schema({
  name: { type: String, required: true, unique: true },
  phone: { type: String },
  email: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Customer = models.Customer || model('Customer', CustomerSchema);
