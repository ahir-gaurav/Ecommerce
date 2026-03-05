import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import HeroSlide from '../models/HeroSlide.js';

async function patchBadgeText() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all slides with empty or missing badgeText
        const result = await HeroSlide.updateMany(
            { $or: [{ badgeText: '' }, { badgeText: null }, { badgeText: { $exists: false } }] },
            { $set: { badgeText: 'New Arrival' } }
        );

        console.log(`✅ Patched ${result.modifiedCount} slide(s) with default badge text.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Patch failed:', err.message);
        process.exit(1);
    }
}

patchBadgeText();
