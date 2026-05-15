"use server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { revalidatePath } from "next/cache";

// 1. Fetch products added by Admin (Not hardcoded)
export async function getInventoryItems() {
  await connectDB();
  return JSON.parse(JSON.stringify(await Product.find({})));
}

// 2. Save the Order with Step Logic
export async function createStepOrder(orderData: any) {
  await connectDB();
  
  const newOrder = new Order({
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    items: orderData.items,
    totalAmount: orderData.totalAmount,
    advancePaid: orderData.paidNow,
    // Tracking which step the customer is on (e.g., Step 1: Booking, Step 2: Shooting, Step 3: Final)
    paymentStep: orderData.currentStep || 1, 
    status: orderData.paidNow >= orderData.totalAmount ? "COMPLETED" : "PARTIAL",
  });

  await newOrder.save();
  revalidatePath("/customers");
  return { success: true };
}