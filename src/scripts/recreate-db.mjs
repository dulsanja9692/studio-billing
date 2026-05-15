import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Define inline schemas since we are running as a standalone ESM script
// and importing TS models might be complex without a transpiler
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, default: 'Service' },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

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
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully.');

    const dbName = mongoose.connection.name;
    console.log(`🗑️ Dropping database: ${dbName}...`);
    await mongoose.connection.dropDatabase();
    console.log(`✅ Database ${dbName} dropped.`);

    console.log('🌱 Seeding initial products...');
    await Product.insertMany(initialProducts);
    console.log(`✅ Seeded ${initialProducts.length} products.`);

    console.log('\n✨ Database recreation complete!');
    console.log('🚀 You can now connect with MongoDB Compass at:', MONGODB_URI);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error recreating database:');
    console.error(error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: It looks like your MongoDB server is not running.');
      console.log('Please start the MongoDB service and try again.');
    }
    
    process.exit(1);
  }
}

recreateDB();
