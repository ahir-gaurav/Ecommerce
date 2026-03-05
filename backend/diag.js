import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

const HeroSlideSchema = new mongoose.Schema({}, { strict: false });
const HeroSlide = mongoose.model('HeroSlide', HeroSlideSchema);

import fs from 'fs';

async function diagnose() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        const results = {
            productsIndexes: await Product.collection.indexes(),
            productsCount: await Product.countDocuments(),
            heroSlidesCount: await HeroSlide.countDocuments(),
            duplicates: await Product.aggregate([
                { $unwind: "$variants" },
                { $group: { _id: "$variants.sku", count: { $sum: 1 }, products: { $addToSet: "$name" } } },
                { $match: { count: { $gt: 1 }, _id: { $ne: null, $ne: "" } } }
            ]),
            heroSlides: await HeroSlide.find().sort({ order: 1 })
        };
        fs.writeFileSync('diag_results.json', JSON.stringify(results, null, 2));
        console.log('✅ Results written to diag_results.json');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

diagnose();
