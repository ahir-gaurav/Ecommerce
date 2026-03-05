import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function nuclearWipe() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        try {
            await mongoose.connection.db.dropCollection('heroslides');
            console.log('Successfully dropped heroslides collection');
        } catch (e) {
            console.log('Collection heroslides did not exist or already dropped');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

nuclearWipe();
