import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function reproduceError() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const product = await Product.findOne({});
        if (!product) {
            console.log('No products found to test with.');
            process.exit(0);
        }

        console.log(`Testing with product: ${product.name} (${product._id})`);

        const variantData = {
            type: 'Standard',
            size: 'Medium',
            fragrance: 'Lavender',
            priceAdjustment: 0,
            stock: 10,
            sku: 'TEST-SKU-' + Date.now()
        };

        try {
            console.log('Pushing variant...');
            product.variants.push(variantData);
            console.log('Saving product...');
            await product.save();
            console.log('✅ Success! Variant added.');
        } catch (error) {
            console.error('❌ Caught error during save:');
            console.error('Name:', error.name);
            console.error('Message:', error.message);
            console.error('Code:', error.code);
            console.error('Errors:', error.errors ? JSON.stringify(error.errors, null, 2) : 'none');
            console.error('Stack:', error.stack);
        }

        process.exit(0);
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

reproduceError();
