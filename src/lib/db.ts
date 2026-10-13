import { db, getDB } from "./firebase";

export { db, getDB };

/**
 * Backward compatibility wrapper for connectDB.
 * With Firebase Firestore, connections are managed by the Firebase Admin SDK.
 */
export async function connectDB() {
  return getDB();
}