import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { verifyToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Add review
router.post('/', verifyToken, requireAuth, async (req, res) => {
    try {
        const { productId, rating, title, comment } = req.body;

        // Check if user has purchased the product
        const order = await Order.findOne({
            user: req.currentUser._id,
            'items.product': productId,
            'paymentInfo.status': 'Completed'
        });

        const review = await Review.create({
            product: productId,
            user: req.currentUser._id,
            userName: req.currentUser.name,
            rating,
            title,
            comment,
            isVerifiedPurchase: !!order
        });

        // Update product rating
        const reviews = await Review.find({ product: productId });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(productId, {
            averageRating: avgRating,
            totalReviews: reviews.length
        });

        res.status(201).json({ success: true, review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }
        res.status(500).json({ success: false, message: 'Failed to add review' });
    }
});

// Get product reviews
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

// Mark review as helpful
router.put('/:id/helpful', verifyToken, requireAuth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review.helpfulBy.includes(req.currentUser._id)) {
            review.helpfulBy.push(req.currentUser._id);
            review.helpfulCount += 1;
            await review.save();
        }

        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update review' });
    }
});

export default router;
