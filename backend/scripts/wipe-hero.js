import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function wipeHero() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('heroslides');

        try {
            await collection.dropIndex('slideIndex_1');
            console.log('Dropped old slideIndex unique index');
        } catch (e) {
            console.log('No old index to drop or already dropped');
        }

        const result = await collection.deleteMany({});
        console.log(`Deleted ${result.deletedCount} legacy hero slides`);

        process.exit(0);
    } catch (err) {
        console.error('Wipe failed:', err);
        process.exit(1);
    }
}

wipeHero();
