import { getApps, initializeApp, cert, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let dbInstance: Firestore | null = null;

function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Check if direct Service Account JSON file path is provided or if serviceAccountKey.json exists locally
  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const defaultLocalPath = path.resolve(process.cwd(), "serviceAccountKey.json");
  const serviceAccountPath = explicitPath || (fs.existsSync(defaultLocalPath) ? defaultLocalPath : null);

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      const fileData = fs.readFileSync(serviceAccountPath, "utf8");
      const serviceAccount = JSON.parse(fileData);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      });
    } catch (err: any) {
      console.error("❌ Failed to parse service account JSON file:", err.message);
    }
  }

  // 2. Check if whole JSON is passed in FIREBASE_SERVICE_ACCOUNT string env variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      });
    } catch (err: any) {
      console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env string:", err.message);
    }
  }

  // 3. Check individual environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // Unescape private key newlines if loaded from single-line string
    privateKey = privateKey.replace(/\\n/g, "\n");
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  // 4. Fallback: Initialize with projectId only if available (e.g. for Google Cloud default credentials / emulator)
  if (projectId) {
    return initializeApp({ projectId });
  }

  // If no credentials found, throw descriptive error with configuration help
  throw new Error(
    "Firebase credentials not found! Please configure your Firebase credentials in .env.local " +
    "(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) or place serviceAccountKey.json in the studio-billing folder."
  );
}

export function getDB(): Firestore {
  if (!dbInstance) {
    const app = getFirebaseApp();
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

// Lazy-proxy export so importing `db` doesn't throw at build-time if credentials are not yet set
export const db = new Proxy({} as Firestore, {
  get(_target, prop: string | symbol) {
    const firestore = getDB();
    const value = (firestore as any)[prop];
    return typeof value === "function" ? value.bind(firestore) : value;
  },
});
