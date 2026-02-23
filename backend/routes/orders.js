import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { verifyToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendOrderConfirmation, sendAdminAlert } from '../utils/email.js';
import { generateInvoice } from '../utils/pdf.js';

const router = express.Router();

// Create order (authenticated user)
router.post('/', verifyToken, requireAuth, async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;

        // Get settings
        const gstSetting = await Settings.findOne({ key: 'gst_percentage' });
        const deliverySetting = await Settings.findOne({ key: 'delivery_charge' });

        const gstPercentage = gstSetting?.value || parseFloat(process.env.DEFAULT_GST_PERCENTAGE);
        const deliveryCharge = deliverySetting?.value || parseFloat(process.env.DEFAULT_DELIVERY_CHARGE);

        // Calculate pricing
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            const variant = product.variants.id(item.variantId);
            if (!variant || variant.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }

            const itemPrice = product.basePrice + variant.priceAdjustment;
            subtotal += itemPrice * item.quantity;

            orderItems.push({
                product: product._id,
                productName: product.name,
                variantId: variant._id,
                variantDetails: {
                    type: variant.type,
                    size: variant.size,
                    fragrance: variant.fragrance,
                    sku: variant.sku
                },
                quantity: item.quantity,
                price: itemPrice
            });
        }

        const gst = (subtotal * gstPercentage) / 100;
        const total = subtotal + gst + deliveryCharge;

        // Create order
        const order = await Order.create({
            user: req.currentUser._id,
            items: orderItems,
            pricing: {
                subtotal,
                gst,
                gstPercentage,
                deliveryCharge,
                discount: 0,
                total
            },
            shippingAddress,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        res.status(201).json({ success: true, order });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
});

// Get user orders (authenticated user)
router.get('/', verifyToken, requireAuth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.currentUser._id })
            .sort({ createdAt: -1 })
            .populate('items.product');

        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// Get single order (authenticated user)
router.get('/:id', verifyToken, requireAuth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.currentUser._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
});

// Get all orders (admin only)
router.get('/admin/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product');

        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// Update order status (admin only)
router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { status, note } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderStatus = status;
        order.statusHistory.push({ status, note });

        if (status === 'Delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});

export default router;
