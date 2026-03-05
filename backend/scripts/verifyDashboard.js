import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function verifyDashboard() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.time('Dashboard Fetch Time');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            revenueResult,
            monthlyResult,
            ordersToday,
            productStats,
            totalUsers,
            bestSelling,
            slowMoving
        ] = await Promise.all([
            Order.aggregate([
                { $match: { 'paymentInfo.status': 'Completed' } },
                { $group: { _id: null, total: { $sum: '$pricing.total' } } }
            ]),
            Order.aggregate([
                {
                    $match: {
                        'paymentInfo.status': 'Completed',
                        createdAt: { $gte: thisMonth }
                    }
                },
                { $group: { _id: null, total: { $sum: '$pricing.total' } } }
            ]),
            Order.countDocuments({ createdAt: { $gte: today } }),
            Product.countDocuments({ isActive: true }),
            User.countDocuments(),
            Product.aggregate([
                { $match: { isActive: true } },
                { $unwind: '$variants' },
                { $sort: { 'variants.salesCount': -1 } },
                { $limit: 5 },
                {
                    $project: {
                        _id: 0,
                        product: '$name',
                        variant: { $concat: ['$variants.type', ' - ', '$variants.size', ' - ', '$variants.fragrance'] },
                        salesCount: '$variants.salesCount',
                        stock: '$variants.stock'
                    }
                }
            ]),
            Product.aggregate([
                { $match: { isActive: true } },
                { $unwind: '$variants' },
                { $match: { 'variants.stock': { $gt: 0 } } },
                { $sort: { 'variants.salesCount': 1 } },
                { $limit: 5 },
                {
                    $project: {
                        _id: 0,
                        product: '$name',
                        variant: { $concat: ['$variants.type', ' - ', '$variants.size', ' - ', '$variants.fragrance'] },
                        salesCount: '$variants.salesCount',
                        stock: '$variants.stock'
                    }
                }
            ])
        ]);

        console.timeEnd('Dashboard Fetch Time');

        console.log('--- DASHBOARD STATS ---');
        console.log('Total Revenue:', revenueResult[0]?.total || 0);
        console.log('Monthly Sales:', monthlyResult[0]?.total || 0);
        console.log('Orders Today:', ordersToday);
        console.log('Total Products:', productStats);
        console.log('Total Users:', totalUsers);
        console.log('Best Selling Count:', bestSelling.length);
        console.log('Slow Moving Count:', slowMoving.length);

        if (bestSelling.length > 0) {
            console.log('Top Product:', bestSelling[0].product, '-', bestSelling[0].variant);
        }

        process.exit(0);
    } catch (err) {
        console.error('Dashboard verification failed:', err);
        process.exit(1);
    }
}

verifyDashboard();
