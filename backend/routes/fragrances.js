import express from 'express';
import Fragrance from '../models/Fragrance.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all active fragrances (public - for user frontend variant selection)
router.get('/', async (req, res) => {
    try {
        const fragrances = await Fragrance.find({ isActive: true }).sort({ name: 1 });
        res.json({ success: true, fragrances });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch fragrances' });
    }
});

// GET all fragrances including inactive (admin only)
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        const fragrances = await Fragrance.find().sort({ name: 1 });
        res.json({ success: true, fragrances });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch fragrances' });
    }
});

// CREATE fragrance (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Fragrance name is required' });
        }
        const fragrance = await Fragrance.create({ name, description });
        res.status(201).json({ success: true, fragrance });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A fragrance with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to create fragrance' });
    }
});

// UPDATE fragrance (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const fragrance = await Fragrance.findByIdAndUpdate(
            req.params.id,
            { name, description, isActive },
            { new: true, runValidators: true }
        );
        if (!fragrance) {
            return res.status(404).json({ success: false, message: 'Fragrance not found' });
        }
        res.json({ success: true, fragrance });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A fragrance with this name already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to update fragrance' });
    }
});

// DELETE fragrance (admin only) - hard delete
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const fragrance = await Fragrance.findByIdAndDelete(req.params.id);
        if (!fragrance) {
            return res.status(404).json({ success: false, message: 'Fragrance not found' });
        }
        res.json({ success: true, message: 'Fragrance deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete fragrance' });
    }
});

export default router;
