import 'dotenv/config';
import mongoose from 'mongoose';

async function dump() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collection = mongoose.connection.collection('heroslides');
        const docs = await collection.find({}).toArray();

        console.log('--- DB DUMP ---');
        docs.forEach(d => {
            console.log(JSON.stringify(d, null, 2));
        });
        console.log('---------------');

        const indexes = await collection.indexes();
        console.log('--- INDEXES ---');
        console.log(JSON.stringify(indexes, null, 2));
        console.log('---------------');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
dump();
