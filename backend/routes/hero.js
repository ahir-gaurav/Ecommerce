import express from 'express';
import HeroSlide from '../models/HeroSlide.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { uploadHero, cloudinary } from '../middleware/upload.js';

const router = express.Router();

// GET hero settings (public) - returns single config object
router.get('/', async (req, res) => {
    try {
        // Find the single active hero config, or the most recent one
        let config = await HeroSlide.findOne({ isActive: true }).sort({ updatedAt: -1 });
        if (!config) {
            config = await HeroSlide.findOne().sort({ updatedAt: -1 });
        }
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero config' });
    }
});

// GET hero settings (admin)
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        let config = await HeroSlide.findOne().sort({ updatedAt: -1 });
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero config' });
    }
});

// CREATE or UPDATE hero config (admin)
router.post('/', verifyToken, requireAdmin, (req, res) => {
    uploadHero(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || 'Image upload failed' });
        }

        try {
            const { badgeText, title, highlightText, description, isActive } = req.body;

            // Build the update object
            const updateData = {};
            if (badgeText !== undefined) updateData.badgeText = badgeText;
            if (title !== undefined) updateData.title = title;
            if (highlightText !== undefined) updateData.highlightText = highlightText;
            if (description !== undefined) updateData.description = description;
            if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

            // If a new image was uploaded, first delete the old one from Cloudinary
            if (req.file) {
                const existing = await HeroSlide.findOne().sort({ updatedAt: -1 });
                if (existing?.imagePublicId) {
                    try { await cloudinary.uploader.destroy(existing.imagePublicId); } catch (e) { /* ok */ }
                }
                updateData.image = req.file.path;           // Cloudinary HTTPS URL
                updateData.imagePublicId = req.file.filename; // Cloudinary public_id
            }

            // findOneAndUpdate with upsert — always returns the updated document
            const config = await HeroSlide.findOneAndUpdate(
                {},                          // match any (there's only one config)
                { $set: updateData },
                { new: true, upsert: true, sort: { updatedAt: -1 } }
            );

            res.json({ success: true, config });
        } catch (error) {
            console.error('Hero config save error:', error.message);
            res.status(500).json({ success: false, message: error.message || 'Failed to save hero config' });
        }
    });
});

// DELETE hero config image (admin)
router.delete('/image', verifyToken, requireAdmin, async (req, res) => {
    try {
        const config = await HeroSlide.findOne().sort({ updatedAt: -1 });
        if (!config) return res.status(404).json({ success: false, message: 'No hero config found' });

        if (config.imagePublicId) {
            try { await cloudinary.uploader.destroy(config.imagePublicId); } catch (e) { /* ok */ }
        }
        config.image = '';
        config.imagePublicId = '';
        await config.save();
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove image' });
    }
});

export default router;
