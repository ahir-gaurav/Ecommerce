import 'dotenv/config';
import mongoose from 'mongoose';

async function nuclearReset() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const db = mongoose.connection.db;
        const collection = db.collection('heroslides');

        console.log('🗑️  Dropping the ENTIRE heroslides collection...');
        try {
            await collection.drop();
            console.log('✅ Collection dropped.');
        } catch (e) {
            console.log('ℹ️ Collection might already be empty or gone.');
        }

        console.log('✨ Re-establishing Indexes...');
        // Mongoose will recreate the indexes automatically on start if we define them,
        // but let's do it manually for absolute certainty.
        const newCollection = db.collection('heroslides');
        await newCollection.createIndex({ slideIndex: 1 }, { unique: true });
        console.log('✅ Unique index on slideIndex created.');

        console.log('🏁 Nuclear reset complete. Proceeding to restart server.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Nuclear reset failed:', err);
        process.exit(1);
    }
}
nuclearReset();
