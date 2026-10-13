import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

// GET: Fetch all orders for the Order History page
export async function GET() {
  try {
    const snapshot = await db.collection("orders").get();
    const orders = snapshot.docs
      .map((doc) => ({
        _id: doc.id,
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}

// POST: Create a new billing record (from POS)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const totalAmount = Number(body.totalAmount) || 0;
    const advancePaid = Number(body.advancePaid) || 0;
    const status = advancePaid >= totalAmount ? "COMPLETED" : "PARTIAL";

    const newOrderData = {
      ...body,
      totalAmount,
      advancePaid,
      paymentStep: Number(body.paymentStep) || 1,
      status,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const docRef = await db.collection("orders").add(newOrderData);

    return NextResponse.json({ _id: docRef.id, id: docRef.id, ...newOrderData }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}