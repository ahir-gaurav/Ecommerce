import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function dropSkuIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const collection = mongoose.connection.db.collection('products');

        // List all indexes to find the one on variants.sku
        const indexes = await collection.indexes();
        const skuIndex = indexes.find(idx => idx.key && idx.key['variants.sku'] === 1);

        if (skuIndex) {
            console.log(`Found index: ${skuIndex.name}. Dropping it...`);
            await collection.dropIndex(skuIndex.name);
            console.log('Index dropped successfully.');
        } else {
            console.log('No unique index on variants.sku found.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error dropping index:', err);
        process.exit(1);
    }
}

dropSkuIndex();
