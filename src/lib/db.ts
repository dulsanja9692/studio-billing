import mongoose from 'mongoose';

// 1. Get the URI from your .env.local file
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/** * 2. This part is crucial for Next.js. 
 * We store the connection in a global variable so it survives across reloads.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // If we already have a connection, use it!
  if (cached.conn) {
    return cached.conn;
  }

  // If we don't have a connection, let's create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Fail after 5 seconds instead of 30+
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ Successfully connected to MongoDB local");
      return mongoose;
    }).catch(err => {
      console.error("❌ MongoDB connection error:", err.message);
      throw new Error(`MongoDB connection failed: ${err.message}`);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    throw new Error(e.message || "Database connection error");
  }

  return cached.conn;
}