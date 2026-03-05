import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../backend/.env') });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

const HeroSlideSchema = new mongoose.Schema({}, { strict: false });
const HeroSlide = mongoose.model('HeroSlide', HeroSlideSchema);

async function diagnose() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        const productsIndexes = await Product.collection.indexes();
        console.log('\n--- Products Indexes ---');
        console.log(JSON.stringify(productsIndexes, null, 2));

        const productsCount = await Product.countDocuments();
        console.log('\n--- Counts ---');
        console.log('Products:', productsCount);
        console.log('HeroSlides:', await HeroSlide.countDocuments());

        const sampleProduct = await Product.findOne();
        console.log('\n--- Sample Product Keys ---');
        console.log(sampleProduct ? Object.keys(sampleProduct.toObject()) : 'No products found');

        const duplicates = await Product.aggregate([
            { $unwind: "$variants" },
            { $group: { _id: "$variants.sku", count: { $sum: 1 }, products: { $addToSet: "$name" } } },
            { $match: { count: { $gt: 1 }, _id: { $ne: null, $ne: "" } } }
        ]);
        console.log('\n--- Duplicate Variant SKUs ---');
        console.log(JSON.stringify(duplicates, null, 2));

        const heroSlides = await HeroSlide.find().sort({ order: 1 });
        console.log('\n--- Hero Slides ---');
        heroSlides.forEach(s => {
            console.log(`Order ${s.order}: ${s.headline || s.title} (${s.image ? 'Has Image' : 'No Image'}) - Active: ${s.isActive}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

diagnose();
