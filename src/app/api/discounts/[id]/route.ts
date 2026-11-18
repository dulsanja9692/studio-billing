import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PATCH: Update a discount
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const docRef = db.collection("discounts").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = (body.name || "").trim();
    if (body.code !== undefined) updateData.code = (body.code || "").trim().toUpperCase();
    if (body.type !== undefined) updateData.type = body.type === "FIXED" ? "FIXED" : "PERCENTAGE";
    if (body.value !== undefined) updateData.value = Math.max(0, Number(body.value) || 0);
    if (body.customerType !== undefined) updateData.customerType = body.customerType === "SPECIFIC" ? "SPECIFIC" : "ALL";
    if (body.customerName !== undefined) updateData.customerName = (body.customerName || "").trim();
    if (body.customerPhone !== undefined) updateData.customerPhone = (body.customerPhone || "").trim();
    if (body.minSpend !== undefined) updateData.minSpend = Math.max(0, Number(body.minSpend) || 0);
    if (body.active !== undefined) updateData.active = Boolean(body.active);

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();

    return NextResponse.json({ _id: id, id, ...updatedDoc.data() });
  } catch (error: any) {
    console.error("Error updating discount:", error);
    return NextResponse.json({ error: error.message || "Failed to update discount" }, { status: 500 });
  }
}

// DELETE: Remove a discount
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = db.collection("discounts").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ message: "Discount deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting discount:", error);
    return NextResponse.json({ error: error.message || "Failed to delete discount" }, { status: 500 });
  }
}
