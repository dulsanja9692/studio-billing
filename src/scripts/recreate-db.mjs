import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const defaultLocalPath = path.resolve(rootDir, 'serviceAccountKey.json');
  const serviceAccountPath = explicitPath || (fs.existsSync(defaultLocalPath) ? defaultLocalPath : null);

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
    });
    return getFirestore(app);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
    });
    return getFirestore(app);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    const app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
    return getFirestore(app);
  }

  if (projectId) {
    const app = initializeApp({ projectId });
    return getFirestore(app);
  }

  throw new Error(
    'Firebase credentials not found! Please define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local or place serviceAccountKey.json in the studio-billing folder.'
  );
}

const initialProducts = [
  { name: 'Wedding Photography (Basic)', category: 'Photography', price: 75000, type: 'Service' },
  { name: 'Wedding Photography (Premium)', category: 'Photography', price: 150000, type: 'Service' },
  { name: 'Event Videography', category: 'Videography', price: 50000, type: 'Service' },
  { name: 'Photo Print 8x10', category: 'Printing', price: 1500, type: 'Item' },
  { name: 'Album Design', category: 'Design', price: 5000, type: 'Service' },
  { name: 'Cinematic Highlight', category: 'Videography', price: 35000, type: 'Service' },
];

async function recreateDB() {
  try {
    console.log('🔄 Initializing Firebase Firestore connection...');
    const db = getFirebaseAdmin();
    console.log('✅ Connected to Firebase Firestore.');

    console.log('🗑️ Clearing existing products from Firestore...');
    const productsSnapshot = await db.collection('products').get();
    const batch = db.batch();
    productsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✅ Cleared ${productsSnapshot.size} existing product documents.`);

    console.log('🌱 Seeding initial products...');
    for (const prod of initialProducts) {
      await db.collection('products').add({
        ...prod,
        createdAt: new Date().toISOString(),
      });
    }
    console.log(`✅ Successfully seeded ${initialProducts.length} products to Firestore!`);

    console.log('\n✨ Firebase database setup and seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error recreating Firebase database:');
    console.error(error.message);
    process.exit(1);
  }
}

recreateDB();
