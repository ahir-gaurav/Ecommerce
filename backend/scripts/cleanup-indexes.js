import mongoose from 'mongoose';
import 'dotenv/config';

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.model('Product', new mongoose.Schema({}));

        const indexes = await Product.collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        const staleSku = indexes.find(i => i.key?.['variants.sku'] && i.unique);

        if (staleSku) {
            console.log(`Found stale index: ${staleSku.name}. Dropping...`);
            await Product.collection.dropIndex(staleSku.name);
            console.log('✅ Stale index dropped successfully');
        } else {
            console.log('ℹ️ No stale variants.sku unique index found');
        }

        // Also check for 'sku_1' which might be the name
        if (indexes.find(i => i.name === 'variants.sku_1')) {
            console.log('Found variants.sku_1 index. Dropping...');
            await Product.collection.dropIndex('variants.sku_1');
            console.log('✅ variants.sku_1 index dropped');
        }

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
}

cleanup();
