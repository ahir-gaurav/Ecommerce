import express from 'express';
import Coupon from '../models/Coupon.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all coupons (admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
    }
});

// Create coupon (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to create coupon' });
    }
});

// Update coupon (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update coupon' });
    }
});

// Delete coupon (admin only)
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

// Validate coupon (public/user)
router.post('/validate', async (req, res) => {
    try {
        const { code, amount } = req.body;
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }

        if (amount < coupon.minPurchaseAmount) {
            return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minPurchaseAmount} required for this coupon` });
        }

        let discountValue = 0;
        if (coupon.discountType === 'percentage') {
            discountValue = (amount * coupon.value) / 100;
        } else {
            discountValue = coupon.value;
        }

        res.json({
            success: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                value: coupon.value,
                discountValue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to validate coupon' });
    }
});

export default router;
