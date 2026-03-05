import 'dotenv/config';
import mongoose from 'mongoose';

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to:', mongoose.connection.name);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('\n📋 All databases on this cluster:');
        for (const dbInfo of dbs.databases) {
            console.log(`  - ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);

            const db = mongoose.connection.useDb(dbInfo.name);
            const collections = await db.db.listCollections().toArray();
            console.log(`    Collections: ${collections.map(c => c.name).join(', ')}`);

            if (collections.some(c => c.name === 'products')) {
                const Product = db.db.collection('products');
                const indexes = await Product.indexes();
                const stale = indexes.find(i => i.key['variants.sku'] !== undefined && i.unique);
                if (stale) {
                    console.log(`    ⚠️ Found stale variants.sku unique index in DB ${dbInfo.name}!`);
                } else {
                    console.log(`    ✅ No stale variants.sku unique index in DB ${dbInfo.name}.`);
                }
            }
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

diagnose();
