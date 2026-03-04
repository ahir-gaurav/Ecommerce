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
            console.log(`⚙️  Processing Slide Index: ${slide.slideIndex}...`);

            // Logic handled by the new pre-save hooks in HeroSlide.js
            // but we explicitly trigger it here by saving.
            if (slide.title && !slide.headline) {
                slide.headline = slide.title;
            } else if (slide.headline && !slide.title) {
                slide.title = slide.headline;
            }

            await slide.save();
            console.log(`✅ Slide ${slide.slideIndex} migrated.`);
        }

        console.log('🏁 Migration complete. All documents are now v2 compliant.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
