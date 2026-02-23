import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', verifyToken, requireAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Total revenue
        const completedOrders = await Order.find({ 'paymentInfo.status': 'Completed' });
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.pricing.total, 0);

        // Monthly sales
        const monthlyOrders = await Order.find({
            createdAt: { $gte: thisMonth },
            'paymentInfo.status': 'Completed'
        });
        const monthlySales = monthlyOrders.reduce((sum, order) => sum + order.pricing.total, 0);

        // Orders today
        const ordersToday = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        // Best-selling variants
        const products = await Product.find({ isActive: true });
        const variantSales = [];

        products.forEach(product => {
            product.variants.forEach(variant => {
                variantSales.push({
                    product: product.name,
                    variant: `${variant.type} - ${variant.size} - ${variant.fragrance}`,
                    salesCount: variant.salesCount,
                    stock: variant.stock
                });
            });
        });

        const bestSelling = variantSales.sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
        const slowMoving = variantSales.filter(v => v.stock > 0).sort((a, b) => a.salesCount - b.salesCount).slice(0, 5);

        res.json({
            success: true,
            dashboard: {
                totalRevenue,
                monthlySales,
                ordersToday,
                bestSelling,
                slowMoving,
                totalProducts: products.length,
                totalUsers: await User.countDocuments()
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
});

// Update settings
router.put('/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { gstPercentage, deliveryCharge, lowStockThreshold } = req.body;

        if (gstPercentage !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'gst_percentage' },
                { value: gstPercentage, updatedBy: req.currentAdmin._id },
                { upsert: true }
            );
        }

        if (deliveryCharge !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'delivery_charge' },
                { value: deliveryCharge, updatedBy: req.currentAdmin._id },
                { upsert: true }
            );
        }

        if (lowStockThreshold !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'low_stock_threshold' },
                { value: lowStockThreshold, updatedBy: req.currentAdmin._id },
                { upsert: true }
            );
        }

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

// Get settings
router.get('/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const settings = await Settings.find();
        const settingsObj = {};

        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });

        res.json({ success: true, settings: settingsObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

// Get all users (admin only)
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

export default router;
