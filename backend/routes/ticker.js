import express from 'express';
import Ticker from '../models/Ticker.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all active ticker items (public)
router.get('/', async (req, res) => {
    try {
        const tickers = await Ticker.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, tickers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch ticker items' });
    }
});

// Admin routes below

// Get all ticker items (admin only)
router.get('/admin', verifyToken, requireAdmin, async (req, res) => {
    try {
        const tickers = await Ticker.find().sort({ order: 1 });
        res.json({ success: true, tickers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch ticker items' });
    }
});

// Bulk reorder ticker items (admin only)
router.put('/reorder', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { items } = req.body; // [{ id, order }]
        const ops = items.map(item =>
            Ticker.findByIdAndUpdate(item.id, { order: item.order })
        );
        await Promise.all(ops);
        const tickers = await Ticker.find().sort({ order: 1 });
        res.json({ success: true, tickers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reorder ticker items' });
    }
});

// Create ticker item (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const ticker = await Ticker.create(req.body);
        res.status(201).json({ success: true, ticker });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create ticker item' });
    }
});

// Update ticker item (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const ticker = await Ticker.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!ticker) {
            return res.status(404).json({ success: false, message: 'Ticker item not found' });
        }
        res.json({ success: true, ticker });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update ticker item' });
    }
});

// Delete ticker item (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const ticker = await Ticker.findByIdAndDelete(req.params.id);
        if (!ticker) {
            return res.status(404).json({ success: false, message: 'Ticker item not found' });
        }
        res.json({ success: true, message: 'Ticker item deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete ticker item' });
    }
});

export default router;
