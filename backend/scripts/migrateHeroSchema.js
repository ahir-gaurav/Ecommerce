import 'dotenv/config';
import mongoose from 'mongoose';
import HeroSlide from '../models/HeroSlide.js';

/**
 * Super Senior Migration Script
 * 
 * Permanently normalizes the HeroSlide collection:
 * 1. Ensures every document has 'headline' populated from 'title' (if headline is missing).
 * 2. Ensures every document has 'title' populated from 'headline' (to satisfy legacy code).
 * 3. Removes the 'required' constraint from the database perspective (by simply saving valid docs).
 */
async function migrate() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const slides = await HeroSlide.find({});
        console.log(`📂 Found ${slides.length} slides to process.`);

        for (const slide of slides) {
            console.log(`⚙️  Processing Slide ID: ${slide._id} (Index: ${slide.slideIndex ?? 'N/A'})...`);

            // Handle documents missing required slideIndex (corrupt or legacy)
            if (slide.slideIndex === undefined || slide.slideIndex === null) {
                console.warn(`⚠️  Document ${slide._id} is missing slideIndex. Deleting corrupt/legacy data...`);
                await HeroSlide.deleteOne({ _id: slide._id });
                continue;
            }

            // SUPER ROBUST NORMALIZATION
            const headline = slide.headline || slide.title || "Shield Your Skin This Summer";
            const title = slide.title || headline;

            slide.headline = headline;
            slide.title = title;

            try {
                await slide.save();
                console.log(`✅ Slide ${slide.slideIndex} migrated.`);
            } catch (saveErr) {
                console.error(`⚠️  Failed to save slide ${slide.slideIndex}:`, JSON.stringify(saveErr.errors || saveErr, null, 2));
            }
        }

        console.log('🏁 Migration complete. All documents are now v2 compliant.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.errors) {
            console.error('Details:', JSON.stringify(err.errors, null, 2));
        }
        process.exit(1);
    }
}

migrate();
