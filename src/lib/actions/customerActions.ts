"use server";
import { db } from "@/lib/firebase";
import { revalidatePath } from "next/cache";

// Fetch all customers (merging customer documents with order statistics)
export async function getCustomers() {
  const [customersSnap, ordersSnap] = await Promise.all([
    db.collection("customers").get(),
    db.collection("orders").get(),
  ]);

  // Group orders by customerName
  const ordersByCustomer = new Map<string, any[]>();
  ordersSnap.forEach((doc) => {
    const data = doc.data();
    const order = { id: doc.id, _id: doc.id, ...data };
    const name = data.customerName;
    if (!name) return;
    if (!ordersByCustomer.has(name)) {
      ordersByCustomer.set(name, []);
    }
    ordersByCustomer.get(name)!.push(order);
  });

  // Collect registered customers
  const customersList: any[] = [];
  const registeredNames = new Set<string>();

  customersSnap.forEach((doc) => {
    const data = doc.data();
    const name = data.name || doc.id;
    registeredNames.add(name);
    customersList.push({
      _id: name,
      id: doc.id,
      name: name,
      phone: data.phone || "",
      createdAt: data.createdAt || new Date().toISOString(),
    });
  });

  // Also include customers who have placed orders but weren't separately added to customers collection
  for (const [name, orders] of ordersByCustomer.entries()) {
    if (!registeredNames.has(name)) {
      registeredNames.add(name);
      customersList.push({
        _id: name,
        id: name,
        name: name,
        phone: orders[0]?.customerPhone || "",
        createdAt: orders[0]?.createdAt || new Date().toISOString(),
      });
    }
  }

  const merged = customersList.map((customer) => {
    const orders = ordersByCustomer.get(customer.name) || [];

    // Sort orders descending by createdAt
    orders.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const totalOrders = orders.length;
    const totalPaid = orders.reduce((sum, o) => sum + (Number(o.advancePaid) || 0), 0);
    const totalAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const lastVisit = orders[0]?.createdAt || customer.createdAt;
    const latestOrderId = orders[0]?._id || null;

    const allItems: { name: string; price: number }[] = [];
    const payments: { step: number; amount: number; date: string }[] = [];

    for (const order of orders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (typeof item === "string") {
            allItems.push({ name: item, price: 0 });
          } else if (item && typeof item === "object") {
            allItems.push({ name: item.name || "Unknown Item", price: Number(item.price) || 0 });
          }
        }
      }
      payments.push({
        step: Number(order.paymentStep) || 1,
        amount: Number(order.advancePaid) || 0,
        date: order.createdAt || new Date().toISOString(),
      });
    }

    const uniqueItems = Array.from(new Map(allItems.map((item) => [item.name, item])).values());

    return {
      _id: customer.name,
      phone: customer.phone,
      totalOrders,
      totalPaid,
      totalAmount,
      lastVisit,
      latestOrderId,
      items: allItems,
      payments,
      purchasedProducts: uniqueItems,
    };
  });

  // Sort by lastVisit descending
  merged.sort(
    (a, b) => new Date(b.lastVisit || 0).getTime() - new Date(a.lastVisit || 0).getTime()
  );

  return JSON.parse(JSON.stringify(merged));
}

export async function createCustomer(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || "";

    if (!name) throw new Error("Name is required");

    // Check if customer with this name already exists
    const existing = await db.collection("customers").where("name", "==", name).limit(1).get();
    if (!existing.empty) {
      throw new Error(`Customer with name "${name}" already exists`);
    }

    await db.collection("customers").add({
      name,
      phone,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create customer" };
  }
}

export async function deleteCustomer(name: string) {
  try {
    const snap = await db.collection("customers").where("name", "==", name).get();
    const batch = db.batch();
    snap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete customer" };
  }
}

export async function getCustomerByName(name: string) {
  const [customerSnap, ordersSnap] = await Promise.all([
    db.collection("customers").where("name", "==", name).limit(1).get(),
    db.collection("orders").where("customerName", "==", name).get(),
  ]);

  let customerData: any = null;
  if (!customerSnap.empty) {
    const doc = customerSnap.docs[0];
    customerData = { _id: name, id: doc.id, ...doc.data() };
  }

  const orders: any[] = [];
  ordersSnap.forEach((doc) => {
    orders.push({ _id: doc.id, id: doc.id, ...doc.data() });
  });

  if (!customerData && orders.length === 0) {
    return null;
  }

  if (!customerData) {
    customerData = {
      _id: name,
      name,
      phone: orders[0]?.customerPhone || "",
      createdAt: orders[0]?.createdAt || new Date().toISOString(),
    };
  }

  orders.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const totalOrders = orders.length;
  const totalPaid = orders.reduce((sum, o) => sum + (Number(o.advancePaid) || 0), 0);
  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const allItems: { name: string; price: number }[] = [];
  const payments: { step: number; amount: number; date: string }[] = [];
  let latestPaymentStep = 0;

  for (const order of orders) {
    const stepNum = Number(order.paymentStep) || 1;
    if (stepNum > latestPaymentStep) {
      latestPaymentStep = stepNum;
    }
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (typeof item === "string") {
          allItems.push({ name: item, price: 0 });
        } else if (item && typeof item === "object") {
          allItems.push({ name: item.name || "Unknown Item", price: Number(item.price) || 0 });
        }
      }
    }
    payments.push({
      step: stepNum,
      amount: Number(order.advancePaid) || 0,
      date: order.createdAt || new Date().toISOString(),
    });
  }

  const uniqueItems = Array.from(new Map(allItems.map((item) => [item.name, item])).values());

  return JSON.parse(
    JSON.stringify({
      ...customerData,
      totalOrders,
      totalPaid,
      totalAmount,
      items: allItems,
      latestPaymentStep,
      payments,
      purchasedProducts: uniqueItems,
      balance: totalAmount - totalPaid,
    })
  );
}

// Action to update payment (Edit Advance to Full)
export async function updateCustomerPayment(orderId: string, amount: number) {
  const docRef = db.collection("orders").doc(orderId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error("Order not found");

  const orderData = doc.data() as any;
  const advancePaid = Number(amount) || 0;
  const totalAmount = Number(orderData.totalAmount) || 0;
  const status = advancePaid >= totalAmount ? "COMPLETED" : "PARTIAL";

  await docRef.update({
    advancePaid,
    status,
  });

  revalidatePath("/customers");
  revalidatePath("/orders");
}