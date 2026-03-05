/**
 * fixProductSkuIndex.js
 * 
 * Drops the bad unique index on `variants.sku` from the `products` collection.
 * 
 * Background:
 *   unique:true on an embedded subdocument array field (variants.sku) creates a
 *   global sparse unique index in MongoDB. This means NO two variants across ANY
 *   products can share a SKU — even if they belong to different products.
 *   Worse, it causes E11000 duplicate key errors when creating new products because
 *   Mongoose tries to insert the document and MongoDB checks the global index.
 *
 * Fix:
 *   Drop this broken index. SKU uniqueness is now enforced at the application level.
 *
 * Usage:
 *   node --experimental-vm-modules backend/scripts/fixProductSkuIndex.js
 *   OR (from backend/ dir):
 *   node scripts/fixProductSkuIndex.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function fixProductSkuIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('products');

        // List all existing indexes
        const indexes = await collection.indexes();
        console.log('\n📋 Current indexes on products collection:');
        indexes.forEach(idx => {
            console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
        });

        // Find the bad SKU index (it will be named something like "variants.sku_1")
        const skuIndex = indexes.find(idx => idx.name === 'variants.sku_1');

        if (skuIndex) {
            await collection.dropIndex('variants.sku_1');
            console.log('\n✅ Successfully dropped the bad "variants.sku_1" unique index!');
        } else {
            console.log('\n✅ No "variants.sku_1" index found — it may already have been removed.');
        }

        // Show updated indexes
        const updatedIndexes = await collection.indexes();
        console.log('\n📋 Indexes after fix:');
        updatedIndexes.forEach(idx => {
            console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

fixProductSkuIndex();
