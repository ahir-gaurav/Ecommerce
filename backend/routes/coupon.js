import express from 'express';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Validate coupon (MUST be registered BEFORE /:id routes)
// Optionally authenticated: if user is logged in we check first-order restriction
// ─────────────────────────────────────────────────────────────────────────────
router.post('/validate', async (req, res) => {
    try {
        const { code, amount } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
        }

        // Expiry check
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }

        // Usage limit check
        if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
        }

        // Minimum purchase check
        const cartAmount = parseFloat(amount) || 0;
        if (cartAmount < coupon.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of ₹${coupon.minPurchaseAmount} required for this coupon`
            });
        }

        // First-order check — only if user is authenticated
        if (coupon.applicability === 'FIRST_ORDER_ONLY') {
            // Try to decode token from Authorization header (optional — no hard failure if absent)
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Please log in to use this coupon'
                });
            }

            try {
                const jwt = (await import('jsonwebtoken')).default;
                const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
                const userId = decoded.id;

                const pastOrderCount = await Order.countDocuments({ user: userId });
                if (pastOrderCount > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'This coupon is valid only for your first order'
                    });
                }
            } catch (_err) {
                return res.status(401).json({
                    success: false,
                    message: 'Please log in to use this coupon'
                });
            }
        }

        // Calculate discount
        let discountValue = 0;
        if (coupon.discountType === 'percentage') {
            discountValue = (cartAmount * coupon.value) / 100;
        } else {
            discountValue = Math.min(coupon.value, cartAmount); // can't discount more than cart total
        }
        discountValue = Math.round(discountValue * 100) / 100; // round to 2 decimal places

        const finalTotal = Math.max(0, cartAmount - discountValue);

        res.json({
            success: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                value: coupon.value,
                discountValue,
                finalTotal,
                applicability: coupon.applicability
            }
        });
    } catch (error) {
        console.error('Coupon validate error:', error);
        res.status(500).json({ success: false, message: 'Failed to validate coupon' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Get all coupons
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    } catch (error) {
        console.error('Fetch coupons error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Create coupon
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ success: false, message: messages });
        }
        res.status(500).json({ success: false, message: 'Failed to create coupon' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Update coupon
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update coupon' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Delete coupon
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete coupon' });
    }
});

export default router;
