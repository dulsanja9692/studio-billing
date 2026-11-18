import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Fetch all discounts
export async function GET() {
  try {
    const snapshot = await db.collection("discounts").get();
    const discounts = snapshot.docs
      .map((doc) => ({
        _id: doc.id,
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json(discounts);
  } catch (error: any) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch discounts" }, { status: 500 });
  }
}

// POST: Create a new discount
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Discount name is required" }, { status: 400 });
    }

    const type = body.type === "FIXED" ? "FIXED" : "PERCENTAGE";
    const value = Math.max(0, Number(body.value) || 0);
    const code = (body.code || "").trim().toUpperCase();
    const customerType = body.customerType === "SPECIFIC" ? "SPECIFIC" : "ALL";
    const customerName = (body.customerName || "").trim();
    const customerPhone = (body.customerPhone || "").trim();
    const minSpend = Math.max(0, Number(body.minSpend) || 0);
    const active = body.active !== undefined ? Boolean(body.active) : true;

    const newDiscountData = {
      name,
      code,
      type,
      value,
      customerType,
      customerName: customerType === "SPECIFIC" ? customerName : "",
      customerPhone: customerType === "SPECIFIC" ? customerPhone : "",
      minSpend,
      active,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("discounts").add(newDiscountData);

    return NextResponse.json(
      { _id: docRef.id, id: docRef.id, ...newDiscountData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating discount:", error);
    return NextResponse.json({ error: error.message || "Failed to create discount" }, { status: 500 });
  }
}
