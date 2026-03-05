import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function validateProducts() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const products = await Product.find({});
        log(`Found ${products.length} products. Validating...`);

        for (const product of products) {
            try {
                await product.validate();
                log(`✅ Product ${product._id} (${product.name}) is valid.`);
            } catch (err) {
                log(`❌ Validation failed for product ${product._id} (${product.name}):`);
                log(err.message);
                log('---');
            }
        }

        fs.writeFileSync(join(__dirname, 'validation_results.log'), output);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

validateProducts();
