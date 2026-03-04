import 'dotenv/config';
import mongoose from 'mongoose';

async function purgeAndReset() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        const collection = mongoose.connection.collection('heroslides');

        console.log('🗑️  Dropping all Hero Slides...');
        await collection.deleteMany({});

        console.log('🗑️  Dropping unique index on slideIndex...');
        try {
            await collection.dropIndex('slideIndex_1');
        } catch (e) {
            console.log('ℹ️ Index might already be gone or different name.');
        }

        console.log('🏗️  Creating clean unique index on slideIndex...');
        await collection.createIndex({ slideIndex: 1 }, { unique: true });

        console.log('✨ Database is now completely clean and indexes are reset.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Reset failed:', err);
        process.exit(1);
    }
}
purgeAndReset();
