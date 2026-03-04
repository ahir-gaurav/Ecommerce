import 'dotenv/config';
import mongoose from 'mongoose';
import HeroSlide from '../models/HeroSlide.js';

async function seed() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const slides = [
            { slideIndex: 0, bg: '#D6F2FF', badgeText: 'SPF 50 | PA++++', headline: 'Shield Your Skin\nThis Summer', cta: 'Shop Now →', isActive: true },
            { slideIndex: 1, bg: '#FFF3EC', badgeText: 'FREE Kit on orders above ₹599', headline: 'Your Routine,\nAnywhere', cta: 'Shop Now →', isActive: true },
            { slideIndex: 2, bg: '#F5F5F0', badgeText: 'FREE Face Towel on orders above ₹899', headline: 'Cleanse.\nTreat. Glow.', cta: 'Shop Now →', isActive: true },
        ];

        console.log('🌱 Seeding 3 clean slides...');
        for (const s of slides) {
            await HeroSlide.findOneAndUpdate(
                { slideIndex: s.slideIndex },
                { $set: s },
                { upsert: true, new: true }
            );
            console.log(`✅ Seeded index ${s.slideIndex}`);
        }

        console.log('🏁 Seeding complete. All indices 0, 1, 2 are now occupied.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}
seed();
