import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const collection = db.collection('heroslides');

        const slides = await collection.find({}).toArray();
        console.log(`Migrating ${slides.length} slides...`);

        for (const slide of slides) {
            const update = {};
            if (slide.bgColor && !slide.bg) update.bg = slide.bgColor;
            if (slide.title && !slide.headline) update.headline = slide.title;

            if (Object.keys(update).length > 0) {
                await collection.updateOne({ _id: slide._id }, { $set: update });
                console.log(`Updated slide ${slide._id}`);
            }
        }

        console.log('✅ Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

migrate();
