import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

// GET: Fetch all products/services
export async function GET() {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs
      .map((doc) => ({
        _id: doc.id,
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 });
  }
}

// POST: Save a new product/service
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newProductData = {
      name: body.name,
      category: body.category,
      price: Number(body.price) || 0,
      type: body.type || "Service",
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const docRef = await db.collection("products").add(newProductData);

    return NextResponse.json({ _id: docRef.id, id: docRef.id, ...newProductData }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}