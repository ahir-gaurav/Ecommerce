import express from 'express';
import HeroSlide from '../models/HeroSlide.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { uploadHero, cloudinary } from '../middleware/upload.js';

const router = express.Router();

// GET hero settings (public) - returns single config object + slides array for compatibility
router.get('/', async (req, res) => {
    try {
        // Get all active slides sorted by most recent first
        const slides = await HeroSlide.find({ isActive: true }).sort({ updatedAt: -1 });
        const allSlides = await HeroSlide.find().sort({ updatedAt: -1 });

        // Pick the best slide — most recently updated with an image
        const best = slides.find(s => s.image) || allSlides[0] || null;

        // Always synthesize a `config` object from the best slide so the frontend
        // can read either `.config` or `.slides[n]`
        const config = best ? {
            _id: best._id,
            badgeText: best.badgeText || '🌿 100% Eco-Friendly Shoe Care',
            title: best.title || 'Keep Your Kicks',
            highlightText: best.highlightText || 'Naturally Fresh',
            description: best.description || best.subtitle || '',
            image: best.image || '',
            imagePublicId: best.imagePublicId || '',
            isActive: best.isActive,
            updatedAt: best.updatedAt,
        } : null;

        res.json({ success: true, config, slides: allSlides });
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

// CREATE or UPDATE hero config (admin) - always keeps exactly ONE hero document
router.post('/', verifyToken, requireAdmin, (req, res) => {
    uploadHero(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || 'Image upload failed' });
        }

        try {
            const { badgeText, title, highlightText, description, isActive } = req.body;

            // If a new image was uploaded, delete ALL old images from Cloudinary first
            if (req.file) {
                const allExisting = await HeroSlide.find({});
                for (const doc of allExisting) {
                    if (doc.imagePublicId) {
                        try { await cloudinary.uploader.destroy(doc.imagePublicId); } catch (e) { /* ok */ }
                    }
                }
                // Delete ALL old slide documents — we'll create one fresh one below
                await HeroSlide.deleteMany({});
            }

            // Build the update / insert object
            const updateData = {};
            if (badgeText !== undefined) updateData.badgeText = badgeText;
            if (title !== undefined) updateData.title = title;
            if (highlightText !== undefined) updateData.highlightText = highlightText;
            if (description !== undefined) updateData.description = description;
            updateData.isActive = isActive === 'true' || isActive === true || isActive === undefined ? true : false;

            if (req.file) {
                updateData.image = req.file.path;            // Cloudinary HTTPS URL
                updateData.imagePublicId = req.file.filename; // Cloudinary public_id
            }

            // findOneAndUpdate with upsert — match any remaining document, or create one
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
