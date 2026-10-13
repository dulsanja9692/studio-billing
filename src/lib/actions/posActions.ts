"use server";
import { db } from "@/lib/firebase";
import { revalidatePath } from "next/cache";

// 1. Fetch inventory items/services
export async function getInventoryItems() {
  const snapshot = await db.collection("products").get();
  const products = snapshot.docs.map((doc) => ({
    _id: doc.id,
    id: doc.id,
    ...doc.data(),
  }));
  return JSON.parse(JSON.stringify(products));
}

// 2. Save the Order with Step Logic
export async function createStepOrder(orderData: any) {
  const totalAmount = Number(orderData.totalAmount) || 0;
  const paidNow = Number(orderData.paidNow) || 0;
  const paymentStep = Number(orderData.currentStep) || 1;
  const customerName = (orderData.customerName || "").trim();
  const customerPhone = (orderData.customerPhone || "").trim();

  const newOrder = {
    customerName,
    customerPhone,
    items: orderData.items || [],
    totalAmount,
    advancePaid: paidNow,
    paymentStep,
    status: paidNow >= totalAmount ? "COMPLETED" : "PARTIAL",
    createdAt: new Date().toISOString(),
  };

  await db.collection("orders").add(newOrder);

  // If customer name is provided, ensure customer is registered in customers collection
  if (customerName) {
    const customerQuery = await db
      .collection("customers")
      .where("name", "==", customerName)
      .limit(1)
      .get();

    if (customerQuery.empty) {
      await db.collection("customers").add({
        name: customerName,
        phone: customerPhone,
        createdAt: new Date().toISOString(),
      });
    } else if (customerPhone) {
      const existingDoc = customerQuery.docs[0];
      if (!existingDoc.data().phone) {
        await existingDoc.ref.update({ phone: customerPhone });
      }
    }
  }

  revalidatePath("/customers");
  revalidatePath("/orders");
  return { success: true };
}