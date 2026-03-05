import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function dropIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const db = mongoose.connection.db;
        const collection = db.collection('products');

        console.log('Dropping "variants.sku_1" index...');
        await collection.dropIndex('variants.sku_1');
        console.log('✅ Index successfully dropped.');

        process.exit(0);
    } catch (err) {
        if (err.codeName === 'IndexNotFound') {
            console.log('ℹ️ Index "variants.sku_1" not found. It might already be gone.');
            process.exit(0);
        }
        console.error('❌ Error dropping index:', err.message);
        process.exit(1);
    }
}

dropIndex();
