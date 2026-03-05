import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function checkValidation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: 'heroslides' }).toArray();
        console.log('Collection Info:', JSON.stringify(collections[0], null, 2));

        if (collections[0]?.options?.validator) {
            console.log('Validator found:', JSON.stringify(collections[0].options.validator, null, 2));
        } else {
            console.log('No MongoDB level validator found.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkValidation();
