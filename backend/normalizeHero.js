import 'dotenv/config';
import mongoose from 'mongoose';
import HeroSlide from './models/HeroSlide.js';

async function normalize() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Delete slides with invalid indices (anything not 0, 1, 2)
        const deleteInvalid = await HeroSlide.deleteMany({
            slideIndex: { $nin: [0, 1, 2] }
        });
        console.log(`🧹 Deleted ${deleteInvalid.deletedCount} slides with invalid indices.`);

        // 2. Resolve duplicates for indices 0, 1, 2
        // We keep the one with the most recent 'updatedAt' for each index.
        for (const index of [0, 1, 2]) {
            const duplicates = await HeroSlide.find({ slideIndex: index }).sort({ updatedAt: -1 });
            if (duplicates.length > 1) {
                const toKeep = duplicates[0];
                const toDelete = duplicates.slice(1).map(d => d._id);
                const result = await HeroSlide.deleteMany({ _id: { $in: toDelete } });
                console.log(`♻️ Resolved duplicates for Slide ${index + 1}: kept ${toKeep._id}, deleted ${result.deletedCount} others.`);
            } else if (duplicates.length === 1) {
                console.log(`✅ Slide ${index + 1} is clean (1 document).`);
            } else {
                console.log(`ℹ️ Slide ${index + 1} is missing. Use seedHero.js to initialize.`);
            }
        }

        console.log('✨ Normalization complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Normalization failed:', err);
        process.exit(1);
    }
}

normalize();
