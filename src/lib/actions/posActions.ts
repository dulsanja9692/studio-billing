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
  const subtotal = Number(orderData.subtotal !== undefined ? orderData.subtotal : orderData.totalAmount) || 0;
  const totalAmount = Number(orderData.totalAmount) || 0;
  const paidNow = Number(orderData.paidNow) || 0;
  const paymentStep = Number(orderData.currentStep) || 1;
  const customerName = (orderData.customerName || "").trim();
  let customerPhone = (orderData.customerPhone || "").trim();
  const billNo = (orderData.billNo || `#GS-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
  const discount = orderData.discount || null;

  // If customer phone is empty, check if we already have this customer registered with a phone number
  if (!customerPhone && customerName) {
    try {
      const existingCustomerSnap = await db
        .collection("customers")
        .where("name", "==", customerName)
        .limit(1)
        .get();
      if (!existingCustomerSnap.empty) {
        customerPhone = existingCustomerSnap.docs[0].data()?.phone || "";
      }
    } catch (e) {
      console.warn("Could not check customer phone fallback:", e);
    }
  }

  const newOrder = {
    billNo,
    customerName,
    customerPhone,
    items: orderData.items || [],
    subtotal,
    discount,
    totalAmount,
    advancePaid: paidNow,
    paymentStep,
    status: paidNow >= totalAmount ? "COMPLETED" : "PARTIAL",
    createdAt: new Date().toISOString(),
  };

  const docRef = await db.collection("orders").add(newOrder);

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
      const existingPhone = existingDoc.data()?.phone;
      if (!existingPhone || existingPhone !== customerPhone) {
        await existingDoc.ref.update({ phone: customerPhone });
      }
    }
  }

  revalidatePath("/customers");
  revalidatePath("/orders");
  return { success: true, billNo, orderId: docRef.id, customerPhone };
}