import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function verifyFix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Find a product (or create a dummy one)
        let product = await Product.findOne({ isActive: true });
        if (!product) {
            product = await Product.create({
                name: 'Test Product',
                description: 'Test description',
                basePrice: 100,
                category: 'Test'
            });
        }

        console.log('Product initial variants:', product.variants.length);

        // 2. Simulate Adding a variant (backend logic)
        const variantData = {
            type: 'Standard',
            size: 'Medium',
            fragrance: 'Lavender',
            priceAdjustment: 10,
            stock: 50,
            sku: 'VERIFY-' + Date.now()
        };

        product.variants.push(variantData);
        await product.save();

        const newVariant = product.variants[product.variants.length - 1];

        // Use the same logic as the route
        const responseData = {
            success: true,
            variant: newVariant,
            updatedProduct: product.toJSON() // toJSON triggers the virtuals we enabled
        };

        console.log('--- VERIFICATION RESULTS ---');
        console.log('Success:', responseData.success);
        console.log('New Variant Added:', responseData.variant.sku);
        console.log('Total Stock (Virtual):', responseData.updatedProduct.totalStock);
        console.log('Variant Count:', responseData.updatedProduct.variants.length);

        if (responseData.updatedProduct.totalStock === undefined) {
            console.error('FAIL: totalStock virtual is missing from response!');
        } else {
            console.log('PASS: totalStock virtual is present.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verifyFix();
