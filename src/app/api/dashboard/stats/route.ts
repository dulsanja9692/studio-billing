import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [ordersSnap, customersSnap] = await Promise.all([
      db.collection("orders").get(),
      db.collection("customers").get(),
    ]);

    let todayRevenue = 0;
    let todayOrderCount = 0;
    let totalRevenue = 0;
    let totalAmount = 0;
    let totalOrders = 0;
    const uniqueCustomerNames = new Set<string>();

    customersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.name) uniqueCustomerNames.add(data.name);
    });

    ordersSnap.forEach((doc) => {
      const data = doc.data();
      totalOrders += 1;
      const advancePaid = Number(data.advancePaid) || 0;
      const orderTotal = Number(data.totalAmount) || 0;

      totalRevenue += advancePaid;
      totalAmount += orderTotal;

      if (data.customerName) {
        uniqueCustomerNames.add(data.customerName);
      }

      if (data.createdAt) {
        const orderDate = new Date(data.createdAt);
        if (orderDate >= startOfDay && orderDate <= endOfDay) {
          todayRevenue += advancePaid;
          todayOrderCount += 1;
        }
      }
    });

    const pendingBalance = Math.max(0, totalAmount - totalRevenue);

    return NextResponse.json({
      // Today stats (for backward compatibility)
      totalRevenue: todayRevenue,
      orderCount: todayOrderCount,
      // Comprehensive studio metrics
      todayRevenue,
      todayOrderCount,
      allTimeRevenue: totalRevenue,
      allTimeOrders: totalOrders,
      totalCustomers: uniqueCustomerNames.size,
      pendingBalance,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}