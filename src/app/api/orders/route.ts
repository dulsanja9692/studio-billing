import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { NextResponse } from "next/server";

// GET: Fetch all orders for the Order History page
export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST: Create a new billing record (from POS)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Logic: Determine status based on payment
    const status = body.advancePaid >= body.totalAmount ? "COMPLETED" : "PARTIAL";
    
    const newOrder = await Order.create({
      ...body,
      status: status
    });
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}