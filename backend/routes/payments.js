import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { verifyToken, requireAuth } from '../middleware/auth.js';
import { sendOrderConfirmation, sendAdminAlert } from '../utils/email.js';
import { generateInvoice } from '../utils/pdf.js';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', verifyToken, requireAuth, async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const options = {
            amount: order.pricing.total * 100, // Amount in paise
            currency: 'INR',
            receipt: order.orderNumber
        };

        const razorpayOrder = await razorpay.orders.create(options);

        order.paymentInfo.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
});

// Verify payment
router.post('/verify', verifyToken, requireAuth, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

        // Verify signature
        const sign = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpaySignature !== expectedSign) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Update order
        const order = await Order.findById(orderId).populate('items.product').populate('user');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentInfo.razorpayPaymentId = razorpayPaymentId;
        order.paymentInfo.razorpaySignature = razorpaySignature;
        order.paymentInfo.status = 'Completed';
        order.paymentInfo.method = 'Razorpay';
        order.orderStatus = 'Confirmed';
        order.statusHistory.push({ status: 'Confirmed', note: 'Payment successful' });

        // Update product stock and sales count
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            const variant = product.variants.id(item.variantId);

            if (variant) {
                variant.stock -= item.quantity;
                variant.salesCount += item.quantity;
                await product.save();
            }
        }

        await order.save();

        // Generate invoice
        const invoiceUrl = await generateInvoice({
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            customerEmail: order.user.email,
            shippingAddress: order.shippingAddress,
            items: order.items,
            pricing: order.pricing
        });

        order.invoiceUrl = invoiceUrl;
        await order.save();

        // Send confirmation email
        await sendOrderConfirmation(order.user.email, {
            orderNumber: order.orderNumber,
            customerName: order.user.name,
            items: order.items.map(item => ({
                productName: item.productName,
                variantDetails: `${item.variantDetails.type} - ${item.variantDetails.size} - ${item.variantDetails.fragrance}`,
                quantity: item.quantity,
                price: item.price
            })),
            total: order.pricing.total,
            estimatedDelivery: order.estimatedDelivery.toLocaleDateString()
        });

        // Send admin alert
        await sendAdminAlert(
            'New Order Received',
            `Order #${order.orderNumber} has been placed by ${order.user.name}. Total: ₹${order.pricing.total}`
        );

        res.json({ success: true, message: 'Payment verified successfully', order });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
});

export default router;
