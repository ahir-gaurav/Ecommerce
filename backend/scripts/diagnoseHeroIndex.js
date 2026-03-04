import 'dotenv/config';
import mongoose from 'mongoose';
import HeroSlide from '../models/HeroSlide.js';

async function diagnose() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const allDocs = await HeroSlide.find({}).lean();
        console.log(`📂 Total documents in heroslides: ${allDocs.length}`);

        allDocs.forEach(doc => {
            console.log(`- ID: ${doc._id}, slideIndex: ${doc.slideIndex}, headline: ${doc.headline}`);
        });

        const nullDocs = await HeroSlide.find({
            $or: [
                { slideIndex: null },
                { slideIndex: { $exists: false } }
            ]
        });

        console.log(`⚠️  Found ${nullDocs.length} documents with null/missing slideIndex.`);

        if (nullDocs.length > 0) {
            console.log('🧹 Purging null/missing slideIndex documents...');
            const result = await HeroSlide.deleteMany({
                $or: [
                    { slideIndex: null },
                    { slideIndex: { $exists: false } }
                ]
            });
            console.log(`✅ Deleted ${result.deletedCount} documents.`);
        }

        // Also check if there are duplicates of valid indices
        const counts = {};
        allDocs.forEach(doc => {
            if (doc.slideIndex !== null && doc.slideIndex !== undefined) {
                counts[doc.slideIndex] = (counts[doc.slideIndex] || 0) + 1;
            }
        });

        for (const [idx, count] of Object.entries(counts)) {
            if (count > 1) {
                console.warn(`🚨 Duplicate slideIndex detected: ${idx} (count: ${count})`);
            }
        }

        console.log('🏁 Diagnosis and cleanup complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Diagnosis failed:', err);
        process.exit(1);
    }
}

diagnose();
