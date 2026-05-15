"use server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { revalidatePath } from "next/cache";

// Fetch all customers (merging Customer model with Order stats)
export async function getCustomers() {
  await connectDB();
  
  const baseCustomers = await Customer.find({}).lean();
  
  const stats = await Order.aggregate([
    {
      $group: {
        _id: "$customerName",
        totalOrders: { $sum: 1 },
        totalPaid: { $sum: "$advancePaid" },
        totalAmount: { $sum: "$totalAmount" },
        lastVisit: { $max: "$createdAt" },
        latestOrderId: { $first: "$_id" },
        items: { $push: "$items" },
        payments: { $push: { step: "$paymentStep", amount: "$advancePaid", date: "$createdAt" } }
      }
    },
    { $sort: { lastVisit: -1 } }
  ]);

  const merged = baseCustomers.map(bc => {
    const s = stats.find(item => item._id === bc.name) || {
      totalOrders: 0,
      totalPaid: 0,
      totalAmount: 0,
      lastVisit: bc.createdAt,
      latestOrderId: null,
      items: [],
      payments: []
    };
    
    const allItems = s.items.flat().map((item: any) => {
      if (typeof item === 'string') return { name: item, price: 0 };
      return { name: item.name || 'Unknown Item', price: item.price || 0 };
    });
    
    const uniqueItems = Array.from(new Map(allItems.map((item: any) => [item.name, item])).values());

    return {
      _id: bc.name,
      phone: bc.phone,
      ...s,
      purchasedProducts: uniqueItems
    };
  });

  return JSON.parse(JSON.stringify(merged));
}

export async function createCustomer(formData: FormData) {
  try {
    await connectDB();
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    if (!name) throw new Error("Name is required");

    await Customer.create({ name, phone });
    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create customer" };
  }
}

export async function deleteCustomer(name: string) {
  try {
    await connectDB();
    await Customer.deleteOne({ name });
    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete customer" };
  }
}

export async function getCustomerByName(name: string) {
  await connectDB();
  const customer = await Customer.findOne({ name }).lean();
  if (!customer) return null;

  const stats = await Order.aggregate([
    { $match: { customerName: name } },
    {
      $group: {
        _id: "$customerName",
        totalOrders: { $sum: 1 },
        totalPaid: { $sum: "$advancePaid" },
        totalAmount: { $sum: "$totalAmount" },
        items: { $push: "$items" },
        latestPaymentStep: { $max: "$paymentStep" },
        payments: { $push: { step: "$paymentStep", amount: "$advancePaid", date: "$createdAt" } }
      }
    }
  ]);

  const s = stats[0] || { totalOrders: 0, totalPaid: 0, totalAmount: 0, items: [], latestPaymentStep: 0, payments: [] };
  const allItems = s.items.flat().map((item: any) => {
    if (typeof item === 'string') return { name: item, price: 0 };
    return { name: item.name || 'Unknown Item', price: item.price || 0 };
  });

  // Deduplicate by name
  const uniqueItems = Array.from(new Map(allItems.map((item: any) => [item.name, item])).values());

  return JSON.parse(JSON.stringify({
    ...customer,
    ...s,
    purchasedProducts: uniqueItems,
    balance: s.totalAmount - s.totalPaid
  }));
}

// Action to update payment (Edit Advance to Full)
export async function updateCustomerPayment(orderId: string, amount: number) {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  order.advancePaid = amount;
  if (order.advancePaid >= order.totalAmount) {
    order.status = "COMPLETED";
  }
  
  await order.save();
  revalidatePath("/customers");
}