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
// Uses upsert: if a config already exists, update it; otherwise create one
router.post('/', verifyToken, requireAdmin, (req, res) => {
    uploadHero(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || 'Image upload failed' });
        }

        try {
            const { badgeText, title, highlightText, description, isActive } = req.body;

            // Find existing config or create new
            let config = await HeroSlide.findOne().sort({ updatedAt: -1 });

            if (config) {
                // Update existing
                if (badgeText !== undefined) config.badgeText = badgeText;
                if (title !== undefined) config.title = title;
                if (highlightText !== undefined) config.highlightText = highlightText;
                if (description !== undefined) config.description = description;
                if (isActive !== undefined) config.isActive = isActive === 'true' || isActive === true;

                if (req.file) {
                    // Delete old image from Cloudinary
                    if (config.imagePublicId) {
                        try { await cloudinary.uploader.destroy(config.imagePublicId); } catch (e) { /* ok */ }
                    }
                    config.image = req.file.path;
                    config.imagePublicId = req.file.filename;
                }

                await config.save();
                res.json({ success: true, config });
            } else {
                // Create new config
                config = await HeroSlide.create({
                    badgeText: badgeText || '🌿 100% Eco-Friendly Shoe Care',
                    title: title || 'Keep Your Kicks',
                    highlightText: highlightText || 'Naturally Fresh',
                    description: description || 'Bamboo charcoal, cedar & lavender — zero chemicals, 100% biodegradable. Reusable for months.',
                    image: req.file ? req.file.path : '',
                    imagePublicId: req.file ? req.file.filename : '',
                    isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
                });
                res.status(201).json({ success: true, config });
            }
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
